const { neon } = require('@neondatabase/serverless');
const { validateAdminSecret } = require('./_lib/adminAuth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);
  await sql(`
    CREATE TABLE IF NOT EXISTS memory_submissions (
      id serial PRIMARY KEY,
      nickname varchar(80) NOT NULL,
      real_name varchar(80) DEFAULT '',
      memory_types text[] DEFAULT '{}',
      text_content text DEFAULT '',
      contact_type varchar(20) NOT NULL,
      contact_value varchar(100) NOT NULL,
      created_at timestamptz DEFAULT NOW()
    )
  `);

  if (req.method === 'GET') {
    const adminSecret = req.headers['x-admin-secret'];
    if (!(await validateAdminSecret(adminSecret))) {
      return res.status(401).json({ error: '未授权，请检查管理员密钥' });
    }

    try {
      const rows = await sql(
        `SELECT id, nickname, real_name, memory_types, text_content, contact_type, contact_value, created_at
         FROM memory_submissions
         ORDER BY created_at DESC`
      );
      return res.status(200).json({ data: rows });
    } catch (err) {
      console.error('[GET /api/memory-submissions]', err);
      return res.status(500).json({ error: '数据库查询失败', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const { nickname, real_name = '', memory_types = [], text_content = '', contact_type, contact_value } = body || {};
    if (!nickname || !contact_type || !contact_value) {
      return res.status(400).json({ error: '缺少必填字段：nickname、contact_type、contact_value' });
    }
    if (!Array.isArray(memory_types) || memory_types.length === 0) {
      return res.status(400).json({ error: '请至少选择一种回忆类型' });
    }

    if (String(nickname).trim().length > 80) {
      return res.status(400).json({ error: '昵称不能超过80个字符' });
    }
    if (String(real_name).trim().length > 80) {
      return res.status(400).json({ error: '姓名不能超过80个字符' });
    }
    if (String(contact_value).trim().length > 100) {
      return res.status(400).json({ error: '联系方式不能超过100个字符' });
    }
    if (String(text_content).trim().length > 5000) {
      return res.status(400).json({ error: '文字回忆不能超过5000个字符' });
    }

    try {
      const rows = await sql(
        `INSERT INTO memory_submissions (nickname, real_name, memory_types, text_content, contact_type, contact_value)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, nickname, real_name, memory_types, text_content, contact_type, contact_value, created_at`,
        [
          String(nickname).trim(),
          String(real_name).trim(),
          memory_types,
          String(text_content).trim(),
          String(contact_type).trim(),
          String(contact_value).trim()
        ]
      );
      return res.status(201).json({ data: rows[0] });
    } catch (err) {
      console.error('[POST /api/memory-submissions]', err);
      return res.status(500).json({ error: '数据库写入失败', detail: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const adminSecret = req.headers['x-admin-secret'];
    if (!(await validateAdminSecret(adminSecret))) {
      return res.status(401).json({ error: '未授权' });
    }
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: '缺少 id' });
    try {
      await sql('DELETE FROM memory_submissions WHERE id = $1', [parseInt(id)]);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[DELETE /api/memory-submissions]', err);
      return res.status(500).json({ error: '删除失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
