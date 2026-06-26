const { neon } = require('@neondatabase/serverless');
const { validateAdminSecret } = require('./adminAuth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const adminSecret = req.headers['x-admin-secret'];
  if (!(await validateAdminSecret(adminSecret))) {
    return res.status(401).json({ error: '未授权' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const { rows } = body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: '请提供 rows 数组' });
  }

  if (rows.length > 500) {
    return res.status(400).json({ error: '单次最多导入 500 条' });
  }

  const VALID_TYPES = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子', '有啥说啥'];
  const sql = neon(process.env.DATABASE_URL);

  const valid = [];
  const errors = [];

  rows.forEach((row, i) => {
    const idx = i + 1;
    const content = String(row.content || '').trim();
    const type = String(row.type || '').trim();
    const created_at = row.created_at ? new Date(row.created_at) : new Date();

    if (!content) { errors.push(`第 ${idx} 行：内容为空`); return; }
    if (!type) { errors.push(`第 ${idx} 行：类型为空`); return; }
    if (!VALID_TYPES.includes(type)) { errors.push(`第 ${idx} 行：无效类型「${type}」`); return; }
    if (isNaN(created_at.getTime())) { errors.push(`第 ${idx} 行：时间格式错误`); return; }

    valid.push({ created_at: created_at.toISOString(), content, type });
  });

  if (valid.length === 0) {
    return res.status(400).json({ error: '无有效数据', details: errors });
  }

  try {
    let inserted = 0;
    for (const row of valid) {
      await sql(
        `INSERT INTO submissions (created_at, content, type) VALUES ($1, $2, $3)`,
        [row.created_at, row.content, row.type]
      );
      inserted++;
    }

    return res.status(200).json({
      success: true,
      imported: inserted,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('[POST /api/submissions-bulk]', err);
    return res.status(500).json({ error: '导入失败', detail: err.message });
  }
};
