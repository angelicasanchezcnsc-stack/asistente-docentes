// Prueba de la fase 10: privacidad del banco de la consulta pública y medición del asistente con esas preguntas.
// El banco vive fuera del proyecto (carpeta privada). Aquí solo se guardan cifras agregadas: nunca preguntas ni ids.
// Playwright, Chromium, archivo abierto con file://.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const privado = path.resolve(process.env.PRIVADO_CONSULTA_PUBLICA || path.join(raiz, '..', 'PRIVADO_CONSULTA_PUBLICA'));
const rutaBanco = path.join(privado, 'banco.json');
const carpeta = path.join(raiz, 'pruebas', 'resultados');
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });
const normaliza = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/* 1. Privacidad (siempre) */
const dentro = privado === raiz || privado.startsWith(raiz + path.sep);
prueba('privacidad: la carpeta privada está fuera del proyecto', !dentro, privado);
const versionados = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
const nombresPrivados = versionados.filter((f) => /candidatas|banco|vocabulario|privado/i.test(path.basename(f)));
prueba('privacidad: git no versiona archivos de candidatas, banco, vocabulario ni de la carpeta privada', nombresPrivados.length === 0, nombresPrivados.join(', '));

const banco = existsSync(rutaBanco) ? JSON.parse(readFileSync(rutaBanco, 'utf8')) : null;
let medicion = null;
if (!banco) {
  console.log('Banco de la consulta pública no disponible: medición omitida');
} else {
  const largas = banco.map((d) => normaliza(d.pregunta)).filter((t) => t.length >= 30);
  const texto = /\.(md|mjs|js|json|py|html|css|txt|yml|csv)$/i;
  const conPregunta = versionados.filter((f) => texto.test(f) && existsSync(path.join(raiz, f))).filter((f) => {
    const contenido = normaliza(readFileSync(path.join(raiz, f), 'utf8'));
    return largas.some((t) => contenido.includes(t));
  });
  prueba(`privacidad: ningún archivo versionado contiene preguntas del banco (${largas.length} revisadas)`, conPregunta.length === 0, conPregunta.join(', '));
  let noPasan = '?';
  try { noPasan = execFileSync('python', [path.join(raiz, 'herramientas', 'consulta_publica.py'), 'verificar', '--privado', privado], { encoding: 'utf8' }).trim(); } catch (e) { noPasan = (e.stdout || '').trim() || 'error'; }
  prueba('privacidad: todas las preguntas del banco pasan de nuevo los filtros (no pasan: 0)', noPasan === '0', `no pasan: ${noPasan}`);

  /* 2. Medición: cada pregunta sin entidad; se leen data-tipo y data-fuente-principal */
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
  await contexto.addInitScript(() => { localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true })); });
  const pagina = await contexto.newPage();
  await pagina.goto(url);
  const filas = [];
  for (let i = 0; i < banco.length; i++) {
    const d = banco[i];
    await pagina.evaluate(() => { document.getElementById('entidad').value = ''; });
    const antes = await pagina.evaluate(() => document.querySelectorAll('#log article[data-tipo]').length);
    await pagina.fill('#pregunta', d.pregunta);
    await pagina.press('#pregunta', 'Enter');
    await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
    const r = await pagina.evaluate(() => { const a = Array.from(document.querySelectorAll('#log article[data-tipo]')).pop(); return { tipo: a.dataset.tipo, principal: a.dataset.fuentePrincipal }; });
    filas.push({ articulo: d.articulo_observado, esperada: d.fuente_esperada, ...r });
    if ((i + 1) % 50 === 0) await pagina.evaluate(() => { document.getElementById('log').innerHTML = ''; });
  }
  await navegador.close();
  const pct = (n, t) => (t ? Math.round((1000 * n) / t) / 10 : 0);
  const coincide = (f) => f.esperada && (f.tipo === 'faq' || f.tipo === 'pasaje') && new RegExp('^' + f.esperada.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\b|,|\\.|$)').test(f.principal) && !new RegExp('^' + f.esperada + '\\d').test(f.principal);
  const resumen = (lista) => {
    const tipos = {};
    for (const t of ['faq', 'pasaje', 'depende-entidad', 'no-encontrado', 'tema-reservado']) tipos[t] = pct(lista.filter((f) => f.tipo === t).length, lista.length);
    const conFuente = lista.filter((f) => f.esperada && (f.tipo === 'faq' || f.tipo === 'pasaje'));
    return { preguntas: lista.length, tipos, noEncontrado: tipos['no-encontrado'], fuenteEsperada: pct(conFuente.filter(coincide).length, conFuente.length) };
  };
  const porArticulo = {};
  for (const art of [...new Set(filas.map((f) => f.articulo))]) porArticulo[art] = resumen(filas.filter((f) => f.articulo === art));
  medicion = { ...resumen(filas), porArticulo };
  prueba('medición: todas las preguntas del banco obtuvieron una respuesta', filas.length === banco.length, `${filas.length} de ${banco.length}`);
}

/* 3. Resultados: solo cifras agregadas */
mkdirSync(carpeta, { recursive: true });
const salida = { fecha: new Date().toISOString(), disponible: Boolean(banco), medicion, resultados };
writeFileSync(path.join(carpeta, 'consulta_publica.json'), JSON.stringify(salida, null, 2), 'utf8');
if (banco) {
  const guardado = normaliza(readFileSync(path.join(carpeta, 'consulta_publica.json'), 'utf8'));
  const fuga = banco.map((d) => normaliza(d.pregunta)).filter((t) => t.length >= 30).some((t) => guardado.includes(t));
  prueba('privacidad: el archivo de resultados no contiene preguntas del banco', !fuga);
  writeFileSync(path.join(carpeta, 'consulta_publica.json'), JSON.stringify({ ...salida, resultados }, null, 2), 'utf8');
}
for (const r of resultados) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${r.ok ? '' : ' — ' + r.detalle}`);
if (medicion) console.log(`Medición: ${medicion.preguntas} preguntas; tipos (%) ${JSON.stringify(medicion.tipos)}; con la fuente esperada ${medicion.fuenteEsperada} %`);
const fallas = resultados.filter((r) => !r.ok).length;
console.log(`\nConsulta pública: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
if (fallas) process.exit(1);
