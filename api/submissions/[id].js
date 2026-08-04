// api/submissions/[id].js
// Handles: GET /api/submissions/:id (not used)
//          PATCH /api/submissions/:id → update record
//          DELETE /api/submissions/:id → delete record

const { neon } = require('@neondatabase/serverless');
const { validateAdminSecret } = require('../adminAuth');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body !== 'string') {
      return resolve(req.body);
    }
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);
  const VALID_TYPES = ['寻物启事', '表白', '挂人', '扩列', '吐槽', '交易', '捞人、物', '打听资讯', '寻找搭子', '有啥说啥'];

  // ── PATCH / PUT → 更新稿件 ──
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }

      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: '无效的稿件 ID' });

      const body = await parseJsonBody(req);
      const { content, type, created_at } = body || {};

      const fields = [];
      const params = [];
      if (content !== undefined && content !== null) {
        params.push(String(content).trim());
        fields.push(`content = $${params.length}`);
      }
      if (type !== undefined && type !== null) {
        if (!VALID_TYPES.includes(type)) {
          return res.status(400).json({ error: `无效的投稿类型：${type}` });
        }
        params.push(type);
        fields.push(`type = $${params.length}`);
      }
      if (created_at !== undefined && created_at !== null) {
        params.push(String(created_at).trim());
        fields.push(`created_at = $${params.length}`);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: '没有要更新的字段' });
      }

      params.push(id);
      const rows = await sql(
        `UPDATE submissions SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING id, created_at, content, type`,
        params
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: '稿件不存在' });
      }
      return res.status(200).json({ data: rows[0] });
    } catch (err) {
      console.error('[PATCH/PUT /api/submissions/:id]', err);
      return res.status(500).json({ error: '更新失败', detail: err.message });
    }
  }

  // ── DELETE → 删除稿件 ──
  if (req.method === 'DELETE') {
    try {
      const adminSecret = req.headers['x-admin-secret'];
      if (!(await validateAdminSecret(adminSecret))) {
        return res.status(401).json({ error: '未授权' });
      }

      const id = parseInt(req.query.id, 10);
      if (!id) return res.status(400).json({ error: '无效的稿件 ID' });

      const rows = await sql(
        `DELETE FROM submissions WHERE id = $1 RETURNING id`,
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: '稿件不存在' });
      }
      return res.status(200).json({ deleted: true, id: rows[0].id });
    } catch (err) {
      console.error('[DELETE /api/submissions/:id]', err);
      return res.status(500).json({ error: '删除失败', detail: err.message });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
};
