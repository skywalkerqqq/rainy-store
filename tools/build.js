/* Inline every runtime asset into one portable HTML file. No dependencies. */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'vendor/three.min.js',
  'src/core.js',
  'src/street.js',
  'src/store.js',
  'src/props.js',
  'src/background.js',
  'src/ambient.js',
  'src/main.js',
];

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = files
  .map((f) => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    return '<script>\n/* ---- ' + f + ' ---- */\n' + src.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  })
  .join('\n');

// Drop all external script tags from the dev page and inline the full build.
html = html.replace(/[ \t]*<script src="[^"]+"><\/script>\s*\n/g, '');
// Use a function replacement: minified JS contains "$&" / "$'" sequences which
// would otherwise be interpreted as replacement patterns and corrupt the code.
html = html.replace('</body>', () => scripts + '\n</body>');
html = html.replace(
  '<title>星降マート — Rainy Night Diorama</title>',
  '<title>星降マート — Rainy Night Diorama</title>\n<!-- Self-contained build. All geometry, textures and signs are procedural. -->'
);

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'hoshifuri-mart-rainy-night.html');
fs.writeFileSync(out, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(0);
console.log('built', out, kb + ' KB');
