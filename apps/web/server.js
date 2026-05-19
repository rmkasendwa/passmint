import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './dist/server/entry-server.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const clientRoot = join(__dirname, 'dist/client');
const template = await readFile(join(clientRoot, 'index.html'), 'utf8');
const port = Number(process.env.PORT ?? 8088);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function safeAssetPath(url) {
  const pathname = new URL(url, 'http://localhost').pathname;
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, '');

  return join(clientRoot, normalized);
}

async function serveAsset(request, response) {
  const filePath = safeAssetPath(request.url ?? '/');
  const fileStat = await stat(filePath).catch(() => null);

  if (!fileStat?.isFile()) return false;

  response.writeHead(200, {
    'Content-Length': fileStat.size,
    'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
  return true;
}

createServer(async (request, response) => {
  try {
    if (request.url?.startsWith('/assets/') && (await serveAsset(request, response))) {
      return;
    }

    const html = template.replace('<!--ssr-outlet-->', render(request.url ?? '/'));

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Server error');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Passmint web listening on http://0.0.0.0:${port}`);
});
