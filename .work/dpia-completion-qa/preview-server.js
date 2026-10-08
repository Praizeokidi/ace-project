const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const siteRoot = path.resolve(__dirname, '..', '..', 'ace-main');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  if (req.method === 'POST' && pathname === '/api/dpia-consultation') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString('utf8');
    const boundary = req.headers['content-type']?.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    const delimiter = boundary?.[1] || boundary?.[2];
    const supportNeeds = delimiter
      ? body.split(`--${delimiter}`).slice(1, -1).flatMap((part) => {
          const [headers, value = ''] = part.replace(/^\r?\n/, '').split(/\r?\n\r?\n/);
          return headers?.match(/name="support_needs\[\]"/)
            ? [value.replace(/\r?\n$/, '')]
            : [];
        })
      : [];
    console.log(`QA_FORM_POST ${JSON.stringify({ supportNeeds })}`);
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, reference: 'QA-DPIA-COMPLETION' }));
    return;
  }

  const relativePath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = path.resolve(siteRoot, `.${relativePath}`);
  if (!filePath.startsWith(siteRoot + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    fs.readFile(target, (error, content) => {
      if (error) {
        res.writeHead(404).end('Not found');
        return;
      }
      res.writeHead(200, { 'content-type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream' });
      res.end(content);
    });
  });
});

server.listen(8765, '127.0.0.1', () => console.log(`QA preview serving ${siteRoot} at http://127.0.0.1:8765`));
