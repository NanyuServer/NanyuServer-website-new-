// api/pdf-proxy.js
// 代理转发远程 PDF，绕开目标服务器缺失 CORS 头导致的跨域失败
// GET /api/pdf-proxy?url=<encoded pdf url>

const { Readable } = require('stream');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const target = req.query.url;
  if (!target || !/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: '缺少有效的 url 参数' });
  }

  try {
    const upstream = await fetch(target, { redirect: 'follow' });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `上游返回 ${upstream.status}` });
    }

    const contentType = upstream.headers.get('content-type') || 'application/pdf';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // 流式转发，避免大文件占满内存
    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.pipe(res);
    } else {
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    }
  } catch (err) {
    console.error('[pdf-proxy]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '代理获取失败', detail: err.message });
    } else {
      res.end();
    }
  }
};
