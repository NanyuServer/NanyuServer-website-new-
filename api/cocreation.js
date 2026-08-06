// api/cocreation.js
// POST   /api/cocreation    → 提交共创申请（生成6位验证码）
// GET    /api/cocreation    → 管理端查看所有共创申请（需admin secret）

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

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET → 管理端查看共创申请 ──
  if (req.method === 'GET') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }
      const rows = await sql(`SELECT * FROM cocreation ORDER BY created_at DESC`);
      return res.status(200).json({ data: rows });
    } catch (err) {
      console.error('[GET /api/cocreation]', err);
      return res.status(500).json({ error: '查询失败', detail: err.message });
    }
  }

  // ── POST → 提交共创申请 ──
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { people_count, media_type, roles, accounts, confirmed } = body || {};

      if (!people_count || people_count < 1 || people_count > 5) {
        return res.status(400).json({ error: '共创人数须为1~5人' });
      }
      if (!media_type) {
        return res.status(400).json({ error: '请选择共创媒体类型' });
      }
      if (!confirmed) {
        return res.status(400).json({ error: '请先确认共创须知' });
      }
      if (!roles || Object.keys(roles).length === 0) {
        return res.status(400).json({ error: '请至少填写一个身份的人数' });
      }
      if (!accounts || Object.keys(accounts).length === 0) {
        return res.status(400).json({ error: '请填写抖音号' });
      }

      const code = generateCode();

      const rows = await sql(
        `INSERT INTO cocreation (people_count, media_type, roles, accounts, confirmed, verification_code)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6)
         RETURNING id, people_count, media_type, roles, accounts, verification_code, created_at`,
        [people_count, media_type, JSON.stringify(roles), JSON.stringify(accounts), true, code]
      );

      return res.status(201).json({ data: rows[0] });
    } catch (err) {
      console.error('[POST /api/cocreation]', err);
      return res.status(500).json({ error: '提交失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
