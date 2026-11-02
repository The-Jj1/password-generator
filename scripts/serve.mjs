import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    // Serve only the public app, never repository metadata or development files.
    if (!['index.html', 'favicon.svg', 'robots.txt'].includes(relative) && !/^src\/[a-z-]+\.(js|css)$/.test(relative)) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const content = await readFile(path.join(root, relative));
    response.writeHead(200, { 'Content-Type': `${types[path.extname(relative)] || 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Password Generator: http://127.0.0.1:${port}`));
