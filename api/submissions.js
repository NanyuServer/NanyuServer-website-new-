// api/submissions.js
// 合并所有稿件 CRUD 操作到单个文件，避免 Vercel 动态路由问题
// GET    /api/submissions         → 列表
// POST   /api/submissions         → 新增
// PATCH  /api/submissions?id=123  → 更新
// DELETE /api/submissions?id=123  → 删除

const { neon } = require('@neondatabase/serverless');
const { validateAdminSecret } = require('./adminAuth');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body !== 'string') return resolve(req.body);
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => { if (!data) resolve({}); else try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);
  const VALID_TYPES = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子', '有啥说啥'];

  // ── PATCH / PUT → 更新单条稿件 ──
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: '缺少稿件 ID' });

      const body = await parseJsonBody(req);
      const { content, type, created_at } = body || {};

      const fields = [];
      const params = [];
      if (content !== undefined && content !== null) {
        params.push(String(content).trim());
        fields.push(`content = $${params.length}`);
      }
      if (type !== undefined && type !== null) {
        if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: `无效类型：${type}` });
        params.push(type);
        fields.push(`type = $${params.length}`);
      }
      if (created_at !== undefined && created_at !== null) {
        params.push(String(created_at).trim());
        fields.push(`created_at = $${params.length}`);
      }
      if (fields.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

      params.push(id);
      const rows = await sql(`UPDATE submissions SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, created_at, content, type`, params);
      if (!rows.length) return res.status(404).json({ error: '稿件不存在' });
      return res.status(200).json({ data: rows[0] });
    } catch (err) {
      console.error('[PATCH/PUT /api/submissions]', err);
      return res.status(500).json({ error: '更新失败', detail: err.message });
    }
  }

  // ── DELETE → 删除单条稿件 ──
  if (req.method === 'DELETE') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }
      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: '缺少稿件 ID' });

      const rows = await sql(`DELETE FROM submissions WHERE id = $1 RETURNING id`, [id]);
      if (!rows.length) return res.status(404).json({ error: '稿件不存在' });
      return res.status(200).json({ deleted: true, id: rows[0].id });
    } catch (err) {
      console.error('[DELETE /api/submissions]', err);
      return res.status(500).json({ error: '删除失败', detail: err.message });
    }
  }

  // ── GET → 列表 ──
  if (req.method === 'GET') {
    const { type, start, end, order = 'desc', limit = '9999', hidden } = req.query;
    const conditions = [];
    const params = [];
    if (type) { params.push(type); conditions.push(`type = $${params.length}`); }
    if (start) { params.push(start); conditions.push(`created_at >= $${params.length}::timestamptz`); }
    if (end) { params.push(end + ' 23:59:59'); conditions.push(`created_at <= $${params.length}::timestamptz`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';
    params.push(parseInt(limit, 10) || 9999);

    try {
      // 先尝试查询含 hidden 字段（新库）
      let rows;
      try {
        const hiddenCond = hidden !== 'true' ? (where ? ' AND hidden = FALSE' : 'WHERE hidden = FALSE') : '';
        rows = await sql(`SELECT id, created_at, content, type, hidden FROM submissions ${where}${hiddenCond} ORDER BY created_at ${sortDir} LIMIT $${params.length}`, params);
      } catch (colErr) {
        // hidden 列不存在（旧库未迁移），回退到无 hidden 查询
        rows = await sql(`SELECT id, created_at, content, type FROM submissions ${where} ORDER BY created_at ${sortDir} LIMIT $${params.length}`, params);
      }
      return res.status(200).json({ data: rows });
    } catch (err) {
      console.error('[GET /api/submissions]', err);
      return res.status(500).json({ error: '查询失败', detail: err.message });
    }
  }

  // ── POST → 新增 ──
  if (req.method === 'POST') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }
      const body = await parseJsonBody(req);
      const { created_at, content, type } = body || {};
      if (!created_at || !content || !type) return res.status(400).json({ error: '缺少必填字段' });
      if (!VALID_TYPES.includes(type)) return res.status(400).json({ error: `无效类型：${type}` });
      if (content.length < 5 || content.length > 2000) return res.status(400).json({ error: '内容长度须在5~2000字' });

      // 查重：时间、内容、类型均一致则判定为重复
      const dupes = await sql(
        `SELECT id FROM submissions WHERE created_at = $1::timestamptz AND content = $2 AND type = $3 LIMIT 1`,
        [created_at, content.trim(), type]
      );
      if (dupes.length > 0) {
        return res.status(409).json({ error: '重复稿件：已存在相同时间、内容、类型的稿件', duplicate_id: dupes[0].id });
      }

      const rows = await sql(`INSERT INTO submissions (created_at, content, type) VALUES ($1::timestamptz, $2, $3) RETURNING id, created_at, content, type`, [created_at, content.trim(), type]);
      return res.status(201).json({ data: rows[0] });
    } catch (err) {
      console.error('[POST /api/submissions]', err);
      return res.status(500).json({ error: '写入失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
