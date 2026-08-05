// api/withdrawals.js
// GET    /api/withdrawals              → 管理端查看所有撤稿记录（需admin secret）
// POST   /api/withdrawals              → 当事人提交撤稿（content精确匹配 + qq号）
// DELETE /api/withdrawals?id=123       → 管理端取消撤稿（恢复稿件可见）

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET → 管理端查看撤稿记录 ──
  if (req.method === 'GET') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }
      const rows = await sql(
        `SELECT w.id, w.submission_id, w.submission_content, w.qq_number, w.created_at
         FROM withdrawals w ORDER BY w.created_at DESC`
      );
      return res.status(200).json({ data: rows });
    } catch (err) {
      console.error('[GET /api/withdrawals]', err);
      return res.status(500).json({ error: '查询失败', detail: err.message });
    }
  }

  // ── POST → 当事人提交撤稿 ──
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { content, qq_number } = body || {};

      if (!content || !content.trim()) {
        return res.status(400).json({ error: '请输入稿件内容' });
      }
      if (!qq_number || !qq_number.trim()) {
        return res.status(400).json({ error: '请输入QQ号' });
      }

      // 精确匹配稿件内容
      const matches = await sql(
        `SELECT id, content FROM submissions WHERE content = $1 AND hidden = FALSE ORDER BY created_at DESC`,
        [content.trim()]
      );

      if (matches.length === 0) {
        return res.status(404).json({ error: '未找到匹配的稿件，请确认内容完全一致' });
      }

      // 取第一条匹配的稿件
      const target = matches[0];

      // 记录撤稿
      const inserted = await sql(
        `INSERT INTO withdrawals (submission_id, submission_content, qq_number)
         VALUES ($1, $2, $3) RETURNING id`,
        [target.id, target.content, qq_number.trim()]
      );

      // 标记稿件隐藏
      await sql(`UPDATE submissions SET hidden = TRUE WHERE id = $1`, [target.id]);

      return res.status(200).json({
        success: true,
        message: '你的稿件已被隐藏',
        withdrawal_id: inserted[0].id
      });
    } catch (err) {
      console.error('[POST /api/withdrawals]', err);
      return res.status(500).json({ error: '提交失败', detail: err.message });
    }
  }

  // ── DELETE → 管理端取消撤稿（恢复稿件可见） ──
  if (req.method === 'DELETE') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }

      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: '缺少撤稿记录 ID' });

      // 找到对应的稿件并恢复
      const record = await sql(
        `SELECT submission_id FROM withdrawals WHERE id = $1`,
        [id]
      );
      if (!record.length) return res.status(404).json({ error: '撤稿记录不存在' });

      await sql(`UPDATE submissions SET hidden = FALSE WHERE id = $1`, [record[0].submission_id]);
      await sql(`DELETE FROM withdrawals WHERE id = $1`, [id]);

      return res.status(200).json({ success: true, message: '撤稿已取消，稿件恢复正常显示' });
    } catch (err) {
      console.error('[DELETE /api/withdrawals]', err);
      return res.status(500).json({ error: '操作失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
