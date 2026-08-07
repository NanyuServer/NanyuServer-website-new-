const { neon } = require('@neondatabase/serverless');
const { validateAdminSecret } = require('./adminAuth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);
  await sql(`
    CREATE TABLE IF NOT EXISTS recruit_positions (
      id serial PRIMARY KEY,
      title varchar(120) NOT NULL,
      description text NOT NULL,
      tags text DEFAULT '',
      apply_url text DEFAULT '',
      created_at timestamptz DEFAULT NOW()
    )
  `);
  await sql(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key varchar(64) PRIMARY KEY,
      value text DEFAULT ''
    )
  `);

  /* ── GET → 读取招募状态 ── */
  if (req.method === 'GET') {
    try {
      const [rows, setting] = await Promise.all([
        sql(`SELECT id, title, description, tags, apply_url, created_at FROM recruit_positions ORDER BY created_at DESC`),
        sql(`SELECT value FROM app_settings WHERE key = 'recruiting_open'`)
      ]);
      const recruitingOpen = setting.length > 0 ? setting[0].value === '1' : true;
      return res.status(200).json({ data: rows, recruiting_open: recruitingOpen });
    } catch (err) {
      console.error('[GET /api/recruitments]', err);
      return res.status(500).json({ error: '数据库查询失败', detail: err.message });
    }
  }

  /* ── PATCH → 切换招募开关（仅管理员） ── */
  if (req.method === 'PATCH') {
    const adminSecret = req.headers['x-admin-secret'];
    if (!(await validateAdminSecret(adminSecret))) {
      return res.status(401).json({ error: '未授权，请检查管理员密钥' });
    }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const { recruiting_open } = body || {};
    if (recruiting_open === undefined) {
      return res.status(400).json({ error: '缺少 recruiting_open 字段' });
    }
    try {
      await sql(
        `INSERT INTO app_settings (key, value) VALUES ('recruiting_open', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [recruiting_open ? '1' : '0']
      );
      return res.status(200).json({ recruiting_open: !!recruiting_open });
    } catch (err) {
      console.error('[PATCH /api/recruitments]', err);
      return res.status(500).json({ error: '更新失败', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const adminSecret = req.headers['x-admin-secret'];
    if (!(await validateAdminSecret(adminSecret))) {
      return res.status(401).json({ error: '未授权，请检查管理员密钥' });
    }

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const { title, description, tags = '', apply_url = '' } = body || {};
    if (!title || !description) {
      return res.status(400).json({ error: '缺少必填字段：title、description' });
    }
    if (title.length > 120) {
      return res.status(400).json({ error: '职位标题不能超过120个字符' });
    }
    if (description.length > 1200) {
      return res.status(400).json({ error: '职位描述不能超过1200个字符' });
    }

    try {
      const rows = await sql(
        `INSERT INTO recruit_positions (title, description, tags, apply_url)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, description, tags, apply_url, created_at`,
        [title.trim(), description.trim(), String(tags).trim(), String(apply_url).trim()]
      );
      return res.status(201).json({ data: rows[0] });
    } catch (err) {
      console.error('[POST /api/recruitments]', err);
      return res.status(500).json({ error: '数据库写入失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
