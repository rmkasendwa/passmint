import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT ?? 5173);

const vite = await createViteServer({
  appType: 'custom',
  root,
  server: {
    host: '0.0.0.0',
    middlewareMode: true,
  },
});

createServer((request, response) => {
  vite.middlewares(request, response, async () => {
    try {
      const url = request.url ?? '/';
      const template = await vite.transformIndexHtml(url, await readFile(`${root}/index.html`, 'utf8'));
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
      const html = template.replace('<!--ssr-outlet-->', render(url));

      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Server error');
    }
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Passmint SSR dev server listening on http://0.0.0.0:${port}`);
});
