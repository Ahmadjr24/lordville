// Builds the whole library into one self-contained HTML file (dist/lordville-library.html):
// app, every asset module and three.js bundled inline, card thumbnails embedded as data URIs.
// Only the Google Fonts stylesheet is still fetched (the page falls back to system fonts offline).
// Usage: node tools/standalone.mjs
// Needs esbuild and three@0.160.0 resolvable from NODE_TOOLS (a folder with node_modules) or the repo.
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tools = process.env.NODE_TOOLS ?? root;
const req = createRequire(path.join(tools, 'package.json'));
const esbuild = req('esbuild');
const threeDir = path.resolve(path.dirname(req.resolve('three')), '..');

const out = await esbuild.build({
  entryPoints: [path.join(root, 'src/app.js')], bundle: true, format: 'esm', write: false, minify: true, target: 'es2020',
  plugins: [{
    name: 'three-local',
    setup(b) {
      b.onResolve({ filter: /^three$/ }, () => ({ path: path.join(threeDir, 'build/three.module.js') }));
      b.onResolve({ filter: /^three\/addons\// }, a => ({ path: path.join(threeDir, 'examples/jsm', a.path.slice('three/addons/'.length)) }));
    },
  }],
});
let js = out.outputFiles[0].text;

// thumbnails: inline as data URIs, looked up by asset id
const thumbs = {};
for (const f of fs.readdirSync(path.join(root, 'thumbs'))) if (f.endsWith('.webp'))
  thumbs[f.slice(0, -5)] = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'thumbs', f)).toString('base64');
const n = (js.match(/thumbs\/\$\{/g) || []).length;
if (!n) throw new Error('thumbnail path not found in the bundle');
js = js.replace(/thumbs\/\$\{([\w.$]+)\}\.webp/g, (_, id) => `\${(window.__THUMBS||{})[${id}]||'thumbs/'+${id}+'.webp'}`);

const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
  .replace(/<script type="module" src="src\/app.js"><\/script>/, '');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${page}
<script>window.__THUMBS = ${JSON.stringify(thumbs)};</script>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>
`.replace(/(<\/title>[\s\S]*?<meta name="description"[^>]*>)/, '$1\n</head>\n<body>');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const dst = path.join(root, 'dist/lordville-library.html');
fs.writeFileSync(dst, html);
console.log(`wrote ${path.relative(root, dst)}: ${(html.length / 1048576).toFixed(2)} MB, ${Object.keys(thumbs).length} thumbnails`);
