const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// Yalnızca uygulamanın statik dosyalarını sun; depo ve test dosyaları yayınlanmaz.
const publicFiles = new Set(['index.html', 'script.js', 'style.css']);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const file = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!publicFiles.has(file) || !['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(404); res.end('Bulunamadı'); return;
      }
      const body = await fs.readFile(path.join(root, file));
      res.writeHead(200, { 'Content-Type': `${mime[path.extname(file)]}; charset=utf-8`, 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.writeHead(500); res.end('Sunucu hatası');
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 5500);
  createServer().listen(port, '127.0.0.1', () => console.log(`BirlikteBul: http://localhost:${port}`));
}
module.exports = { createServer };
