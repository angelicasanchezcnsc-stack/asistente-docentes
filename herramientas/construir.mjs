// Genera asistente-docentes.html (archivo único) a partir de src/, kb.json y faq.json.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...p) => path.join(raiz, ...p);

// 1. JavaScript: un solo bloque IIFE, sin minificar para que sea legible.
const js = await build({
  entryPoints: [ruta('src', 'js', 'main.js')],
  bundle: true, format: 'iife', target: 'es2020', minify: false, write: false, logLevel: 'warning',
  loader: { '.jpg': 'dataurl' } // el logo de accesibilidad de la ONU va incrustado
});

// 2. CSS: las hojas se importan en orden; las fuentes .woff/.woff2 quedan incrustadas como data URL.
const css = await build({
  stdin: {
    contents: ['marca-earm.css', 'chat.css', 'temas.css', 'impresion.css'].map(f => `@import './${f}';`).join('\n'),
    resolveDir: ruta('src', 'css'), loader: 'css'
  },
  bundle: true, write: false, logLevel: 'warning',
  loader: { '.woff': 'dataurl', '.woff2': 'dataurl' }
});

// 3. Datos: kb.json y faq.json como JSON incrustado; cada «</» se escribe «<\/».
const leer = f => JSON.parse(readFileSync(ruta('herramientas', f), 'utf8'));
const datos = JSON.stringify({ kb: leer('kb.json'), faq: leer('faq.json'), reservados: leer('temas_reservados.json') }).replace(/<\//g, '<\/');

// 4. Sustituye los marcadores (con función, para que «$» no se interprete) y escribe el resultado.
const seguro = s => s.replace(/<\/(script|style)/gi, '<\/$1');
let html = readFileSync(ruta('src', 'index.html'), 'utf8');
html = html
  .replace('<!--CSS-->', () => `<style>\n${css.outputFiles[0].text}</style>`)
  .replace('<!--DATOS-->', () => `<script type="application/json" id="datos-kb">${datos}</script>`)
  .replace('<!--JS-->', () => `<script>\n${seguro(js.outputFiles[0].text)}</script>`);
const salida = ruta('asistente-docentes.html');
writeFileSync(salida, html, 'utf8');
console.log('Generado:', salida, (Buffer.byteLength(html, 'utf8') / 1e6).toFixed(2), 'MB');
