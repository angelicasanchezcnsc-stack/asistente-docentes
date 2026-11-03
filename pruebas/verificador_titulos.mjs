// Pruebas del verificador de títulos (verificador-titulos.html). Independientes de las del asistente.
//  1. Núcleo: pruebas/verificador/nucleo.prueba.ts, empaquetado con esbuild (SNIES y manual ficticios).
//  2. Página: flujo de un aspirante, lote, descarga del informe y de las plantillas, sin errores de consola.
//  3. Accesibilidad: axe (wcag2a, wcag2aa, wcag21aa y best-practice) en claro y oscuro, con resultados
//     en pantalla y con el texto al 200 %; reflujo a 320 px sin desplazamiento horizontal.
// Requiere haber construido la página: npm run prueba:verificador lo hace antes.
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { readFileSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const datos = path.join(raiz, 'pruebas', 'verificador');
let fallos = 0, corridas = 0;
const comprobar = (cond, msg) => {
  corridas++;
  if (cond) console.log('  ✅', msg); else { console.error('  ❌ FALLO:', msg); fallos++; }
};

// ── 1. Núcleo ──────────────────────────────────────────────────────────────
console.log('▶ Núcleo');
const tmp = mkdtempSync(path.join(tmpdir(), 'verificador-prueba-'));
try {
  const salida = path.join(tmp, 'nucleo.mjs');
  await build({
    entryPoints: [path.join(datos, 'nucleo.prueba.ts')],
    bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: salida, logLevel: 'warning',
  });
  process.env.VERIFICADOR_DATOS = datos;
  const { resultado } = await import(pathToFileURL(salida).href);
  fallos += resultado.fallos;
  corridas += resultado.corridas;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── 2. Página ──────────────────────────────────────────────────────────────
const pagina = path.join(raiz, 'verificador-titulos.html');
if (!existsSync(pagina)) {
  console.error('Falta verificador-titulos.html: ejecute npm run construir:verificador.');
  process.exit(1);
}
const url = pathToFileURL(pagina).href;
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const aspirantes = path.join(mkdtempSync(path.join(tmpdir(), 'verificador-asp-')), 'aspirantes.csv');
writeFileSync(aspirantes, [
  'inscripcion;opec;empleo_id;folio;institucion;programa;codigo_snies;fecha_grado;pais;convalidado',
  'A-1;100;DA-MAT;1;Universidad Pedagógica de Prueba;Licenciatura en Matemáticas;;10/06/2012;;',
  'A-1;100;DA-MAT;2;Universidad Pedagógica de Prueba;Maestría en Educación;;20/11/2018;;',
  'A-2;100;DA-MAT;1;Fundación Universitaria de Prueba;Administración de Empresas;;01/01/2010;;',
  'A-3;300;DA-SOC;1;Universidad Nacional de Ensayo;Derecho;;01/01/2010;;',
].join('\n'));

const navegador = await chromium.launch();

async function preparar(opciones = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true, ...opciones });
  const p = await contexto.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await p.goto(url);
  await p.setInputFiles('#f-snies', path.join(datos, 'snies-ficticio.xlsx'));
  await p.setInputFiles('#f-manual', path.join(datos, 'manual-ficticio.csv'));
  await p.fill('#f-corte', '2026-12-15');
  await p.waitForFunction(() => /programas/.test(document.querySelector('#e-snies').textContent)
    && /empleos/.test(document.querySelector('#e-manual').textContent));
  return { p, contexto, errores };
}

async function unAspirante(p) {
  await p.selectOption('#i-empleo', 'DA-MAT');
  await p.fill('[data-k="institucion"]', 'Univ Pedagogica de Prueba');
  await p.fill('[data-k="programa"]', 'Licenciado en Matemáticas y Física');
  await p.fill('[data-k="fechaGrado"]', '2014-05-30');
  await p.click('#i-agregar');
  const segundo = p.locator('fieldset').nth(1);
  await segundo.locator('[data-k="institucion"]').fill('Universidad Pedagógica de Prueba');
  await segundo.locator('[data-k="programa"]').fill('Maestría en Educación');
  await segundo.locator('[data-k="fechaGrado"]').fill('2019-05-30');
  await p.click('#i-verificar');
  return p.textContent('#i-resultado');
}

async function lote(p) {
  await p.click('#tab-lote');
  await p.setInputFiles('#f-aspirantes', aspirantes);
  await p.waitForFunction(() => !document.querySelector('#l-procesar').disabled);
  await p.click('#l-procesar');
  return p.textContent('.cifras');
}

async function axe(p, etiqueta) {
  await p.addScriptTag({ content: axeSrc });
  const r = await p.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
  const graves = r.violations.map((v) => `${v.id} (${v.nodes.length})`);
  comprobar(graves.length === 0, `axe sin errores: ${etiqueta}${graves.length ? ' → ' + graves.join(', ') : ''}`);
}

console.log('\n▶ Página');
{
  const { p, contexto, errores } = await preparar();
  comprobar((await p.textContent('#e-snies')).includes('15 programas'), 'carga el SNIES en .xlsx en el navegador');
  await axe(p, 'página inicial');
  const ind = await unAspirante(p);
  comprobar(/Dictamen: Cumple/.test(ind) && /SNIES 90002/.test(ind), 'un aspirante: cumple con el programa 90002');
  comprobar(/No se usa para el requisito mínimo · VA: Maestría/.test(ind), 'un aspirante: la maestría se clasifica para la VA');
  await axe(p, 'con el dictamen de un aspirante');
  const cifras = await lote(p);
  comprobar(/3\s*aspirantes/.test(cifras), 'lote: 3 aspirantes agrupados por inscripción');
  comprobar(/1\s*cumplen/.test(cifras) && /1\s*no cumplen/.test(cifras) && /1\s*a revisión humana/.test(cifras), 'lote: 1 cumple, 1 no cumple, 1 a revisión humana');
  await p.locator('#l-resultado details').first().evaluate((d) => { d.open = true; });
  await axe(p, 'con el resultado del lote');
  const [informe] = await Promise.all([p.waitForEvent('download'), p.click('#l-descargar')]);
  const csv = readFileSync(await informe.path(), 'utf8');
  comprobar(csv.startsWith('﻿') && csv.includes('Dictamen del aspirante') && csv.includes('A-3'), 'descarga el informe CSV');
  await p.click('#tab-ind');
  const [plantilla] = await Promise.all([p.waitForEvent('download'), p.click('[data-plantilla="manual-funciones-plantilla.csv"]')]);
  comprobar(plantilla.suggestedFilename() === 'manual-funciones-plantilla.csv'
    && readFileSync(await plantilla.path(), 'utf8').includes('empleo_id;empleo;area;modo'), 'descarga la plantilla del manual sin internet');
  comprobar(errores.length === 0, `sin errores de consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await contexto.close();
}

console.log('\n▶ Accesibilidad');
{
  const { p, contexto } = await preparar({ colorScheme: 'dark' });
  await unAspirante(p);
  await axe(p, 'tema oscuro con dictamen');
  await lote(p);
  await axe(p, 'tema oscuro con lote');
  await contexto.close();
}
{
  const { p, contexto } = await preparar();
  await p.addStyleTag({ content: 'body { font-size: 36px !important; }' });
  await unAspirante(p);
  await axe(p, 'texto al 200 %');
  await contexto.close();
}
{
  const { p, contexto } = await preparar({ viewport: { width: 320, height: 800 } });
  await unAspirante(p);
  await lote(p);
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  comprobar(desborde <= 0, `reflujo a 320 px sin desplazamiento horizontal (sobra ${desborde} px)`);
  await contexto.close();
}
await navegador.close();
rmSync(path.dirname(aspirantes), { recursive: true, force: true });

if (fallos) {
  console.error(`\n❌ Verificador de títulos: ${fallos}/${corridas} comprobaciones fallaron.`);
  process.exit(1);
}
console.log(`\n✅ Verificador de títulos: ${corridas} comprobaciones pasaron.`);
