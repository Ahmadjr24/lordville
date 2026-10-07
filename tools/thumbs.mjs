// Renders card thumbnails (thumbs/<id>.webp, transparent background) with headless Chromium.
// Usage: node tools/thumbs.mjs            → every asset in src/registry.js
//        node tools/thumbs.mjs sword       → just these ids
// Needs Playwright (`npm i -D playwright`) or PLAYWRIGHT_PATH pointing at its index.mjs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.webp': 'image/webp', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/') {
    // index.html is a fragment (the artifact publisher adds the document skeleton), so wrap it the same way
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
      + fs.readFileSync(path.join(root, 'index.html'), 'utf8') + '</body></html>');
  }
  const p = path.join(root, decodeURIComponent(url.pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const { ASSETS } = await import(path.join(root, 'src/registry.js'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ASSETS.map(a => a.id);

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', e => console.error('page error:', e.message));
for (const id of ids) {
  await page.goto(`http://localhost:${port}/?thumb=${id}`);
  await page.waitForFunction(() => window.__thumb, null, { timeout: 300000 });
  const data = await page.evaluate(() => window.__thumb);
  fs.writeFileSync(path.join(root, 'thumbs', `${id}.webp`), Buffer.from(data.split(',')[1], 'base64'));
  console.log('thumb', id);
}
await browser.close();
server.close();
