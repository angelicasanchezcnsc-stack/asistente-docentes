// Genera verificador-titulos.html (archivo único) a partir de verificador-titulos/.
// Es independiente del asistente: no lee ni modifica src/, kb.json ni asistente-docentes.html.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ruta = (...p) => path.join(raiz, 'verificador-titulos', ...p);

// 1. JavaScript (TypeScript compilado por esbuild): un solo bloque IIFE, sin minificar.
const js = await build({
  entryPoints: [ruta('ui', 'app.ts')],
  bundle: true, format: 'iife', target: 'es2020', minify: false, write: false, logLevel: 'warning',
});

// 2. CSS con la tipografía incrustada como data URL.
const css = await build({
  entryPoints: [ruta('ui', 'estilos.css')],
  bundle: true, write: false, logLevel: 'warning',
  loader: { '.woff2': 'dataurl' },
});

// 3. Plantillas descargables desde la página.
const plantillas = {};
for (const f of readdirSync(ruta('plantillas')).sort()) plantillas[f] = readFileSync(ruta('plantillas', f), 'utf8');
const datos = JSON.stringify(plantillas).replace(/<\//g, '<\\/');

// 4. Marcadores (con función, para que «$» no se interprete).
const seguro = (s) => s.replace(/<\/(script|style)/gi, '<\\/$1');
const html = readFileSync(ruta('ui', 'plantilla.html'), 'utf8')
  .replace('<!--CSS-->', () => `<style>\n${css.outputFiles[0].text}</style>`)
  .replace('<!--DATOS-->', () => `<script type="application/json" id="datos-plantillas">${datos}</script>`)
  .replace('<!--JS-->', () => `<script>\n${seguro(js.outputFiles[0].text)}</script>`);
const salida = path.join(raiz, 'verificador-titulos.html');
writeFileSync(salida, html, 'utf8');
console.log('Generado:', salida, (Buffer.byteLength(html, 'utf8') / 1e6).toFixed(2), 'MB');
