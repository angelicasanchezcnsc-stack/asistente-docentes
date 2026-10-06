// Genera asistente-docentes.html (archivo único) a partir de src/, kb.json y faq.json.
import { build } from 'esbuild';
import { ICONOS } from '../src/js/iconos.js';
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
    contents: ['marca-earm.css', 'chat.css', 'navegacion.css', 'temas.css', 'impresion.css'].map(f => `@import './${f}';`).join('\n'),
    resolveDir: ruta('src', 'css'), loader: 'css'
  },
  bundle: true, write: false, logLevel: 'warning',
  loader: { '.woff': 'dataurl', '.woff2': 'dataurl' }
});

// 3. Datos: kb.json y faq.json como JSON incrustado; cada «</» se escribe «<\/».
const leer = f => JSON.parse(readFileSync(ruta('herramientas', f), 'utf8'));
// Temas de las tarjetas: cada tema apunta a preguntas frecuentes que existen y toda pregunta está en algún tema.
const faq = leer('faq.json');
const temas = leer('temas.json');
const errorTemas = (mensaje) => { console.error('ERROR en herramientas/temas.json: ' + mensaje); process.exit(1); };
const idsFaq = new Set(faq.items.map((f) => f.id));
const idsTemas = new Set();
const usadas = new Set();
for (const t of temas) {
  if (idsTemas.has(t.id)) errorTemas(`el tema «${t.id}» está repetido`);
  idsTemas.add(t.id);
  if (!t.titulo || !t.titulo.trim()) errorTemas(`el tema «${t.id}» no tiene título`);
  if (!t.icono) errorTemas(`el tema «${t.id}» no tiene icono`);
  if (!(t.icono in ICONOS)) errorTemas(`el tema «${t.id}» usa el icono «${t.icono}», que no existe en src/js/iconos.js (${Object.keys(ICONOS).join(', ')})`);
  if (!Array.isArray(t.faq) || t.faq.length === 0) errorTemas(`el tema «${t.id}» no tiene preguntas`);
  for (const id of t.faq) { if (!idsFaq.has(id)) errorTemas(`el tema «${t.id}» cita la pregunta «${id}», que no existe en faq.json`); usadas.add(id); }
}
for (const id of idsFaq) if (!usadas.has(id)) errorTemas(`la pregunta «${id}» de faq.json no está en ningún tema`);
// Cada «</» se escribe «<\/» para que ningún texto cierre el <script> de datos (JSON.parse lee «\/» como «/»).
const datos = JSON.stringify({ kb: leer('kb.json'), faq, reservados: leer('temas_reservados.json'), temas }).replace(/<\//g, '<\\/');

// 4. Sustituye los marcadores (con función, para que «$» no se interprete) y escribe el resultado.
const seguro = s => s.replace(/<\/(script|style)/gi, '<\\/$1');
let html = readFileSync(ruta('src', 'index.html'), 'utf8');
html = html
  .replace('<!--CSS-->', () => `<style>\n${css.outputFiles[0].text}</style>`)
  .replace('<!--DATOS-->', () => `<script type="application/json" id="datos-kb">${datos}</script>`)
  .replace('<!--JS-->', () => `<script>\n${seguro(js.outputFiles[0].text)}</script>`);
const salida = ruta('asistente-docentes.html');
writeFileSync(salida, html, 'utf8');
console.log('Generado:', salida, (Buffer.byteLength(html, 'utf8') / 1e6).toFixed(2), 'MB');
