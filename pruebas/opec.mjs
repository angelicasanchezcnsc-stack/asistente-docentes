// Prueba de la fase 9: bloque «Vacantes en la OPEC» (datos, cuándo aparece, cifras, fuente, tabla, detalle por empleo,
// voz, impresión, saludo, regiones vivas y red). Los valores esperados se leen de herramientas/opec.json.
// Playwright, Chromium, archivo abierto con file://.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const kb = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'kb.json'), 'utf8'));
const crudo = readFileSync(path.join(raiz, 'herramientas', 'opec.json'), 'utf8');
const opec = JSON.parse(crudo);
const casos = JSON.parse(readFileSync(path.join(raiz, 'pruebas', 'preguntas.json'), 'utf8')).casos;
const caso = (n) => casos.find((c) => c.n === n).pregunta;
const N = kb.nAcuerdos;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FECHA = ((a, m, d) => `${d} de ${MESES[m - 1]} de ${a}`)(...opec.corte.split('-').map(Number));
const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const ANTIOQUIA = 'Secretaría de Educación Departamental de Antioquia';
const AMAZONAS = 'Secretaría de Educación Departamental de Amazonas';
const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: false, voz: '', velocidad: 'normal' };

const navegador = await chromium.launch();
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

async function nueva({ panel = {}, prefs = {} } = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
  await contexto.addInitScript(({ panel, prefs }) => {
    window.__leido = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { window.__leido.push(u.text); hablar(u); };
    // Impresión simulada: se guarda el estado de los desplegables del bloque en el momento de imprimir.
    window.__impreso = null;
    window.print = () => {
      const a = document.querySelector('#log .imprimiendo');
      window.__impreso = { exterior: a.querySelector('details.opec-empleos').open, empleosAbiertos: Array.from(a.querySelectorAll('details.opec-empleo')).filter((d) => d.open).map((d) => d.querySelector('summary').textContent) };
    };
    if (!sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify(panel));
      localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true, ...prefs }));
    }
  }, { panel: { ...PRED, ...panel }, prefs });
  const pagina = await contexto.newPage();
  const errores = [], red = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pagina.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) red.push(r.url()); });
  await pagina.goto(url);
  return { contexto, pagina, errores, red };
}
const nRespuestas = (pagina) => pagina.locator('#log article[data-tipo]').count();
async function preguntar(pagina, texto) {
  const antes = await nRespuestas(pagina);
  await pagina.fill('#pregunta', texto);
  await pagina.press('#pregunta', 'Enter');
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
  return pagina.locator('#log article[data-tipo]').nth(antes);
}
/** Cada caso empieza sin entidad (el selector va plegado en «Su entidad (opcional)»). */
const limpiarEntidad = (pagina) => pagina.evaluate(() => { document.getElementById('entidad').value = ''; });
const normaliza = (t) => t.replace(/\s+/g, ' ').trim();

/* Cifras esperadas por empleo, sumadas desde opec.json. */
function esperado(entidad) {
  const filas = opec.entidades[entidad].empleos.map((e) => {
    const s = e.opec.filter((o) => o.modalidad === 'sin-reserva').reduce((x, o) => x + o.vacantes, 0);
    const r = e.opec.filter((o) => o.modalidad === 'reserva').reduce((x, o) => x + o.vacantes, 0);
    return [e.denominacion, miles(s), miles(r), miles(s + r)];
  });
  const ts = opec.entidades[entidad].empleos.flatMap((e) => e.opec).filter((o) => o.modalidad === 'sin-reserva').reduce((x, o) => x + o.vacantes, 0);
  const tr = opec.entidades[entidad].empleos.flatMap((e) => e.opec).filter((o) => o.modalidad === 'reserva').reduce((x, o) => x + o.vacantes, 0);
  return { filas, total: ['Total', miles(ts), miles(tr), miles(ts + tr)], ts, tr };
}

/* 1. Datos */
{
  const acuerdos = kb.docs.filter((d) => d.kind === 'acuerdo').map((d) => d.entity);
  prueba(`datos: las ${acuerdos.length} entidades de kb.json están en opec.json (y ninguna más)`, acuerdos.every((e) => opec.entidades[e]) && Object.keys(opec.entidades).length === acuerdos.length);
  const suma = Object.values(opec.entidades).flatMap((e) => e.empleos).flatMap((e) => e.opec).reduce((x, o) => x + o.vacantes, 0);
  prueba(`datos: la suma de vacantes (${suma}) es totales.vacantes`, suma === opec.totales.vacantes && opec.totales.sinReserva + opec.totales.reserva === suma);
  prueba('datos: ningún texto está vacío', opec.textos.every((t) => t.trim().length > 0));
  const clavesEmpleo = new Set(Object.values(opec.entidades).flatMap((e) => e.empleos).flatMap((e) => Object.keys(e)));
  const clavesOpec = new Set(Object.values(opec.entidades).flatMap((e) => e.empleos).flatMap((e) => e.opec).flatMap((o) => Object.keys(o)));
  prueba('datos: solo las claves previstas (sin NIT, identificadores ni códigos de verificación)',
    [...clavesEmpleo].sort().join() === 'alternativas,denominacion,estudio,experiencia,funciones,nivel,opec' && [...clavesOpec].sort().join() === 'discapacidad,modalidad,numero,vacantes'
    && !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(crudo) && !/nit_entidad|id_cargo|codigo_verificacion|id_unico_entidad/.test(crudo), [...clavesEmpleo, ...clavesOpec].join());
}

/* 2. Cuándo aparece, cifras, fuente y tabla */
{
  const { contexto, pagina, errores, red } = await nueva();
  for (const [n, entidad] of [[4, ANTIOQUIA], [9, AMAZONAS]]) {
    await limpiarEntidad(pagina);
    const art = await preguntar(pagina, caso(n));
    const plegable = await art.evaluate((a) => { const d = a.querySelector('details.opec-plegable'); return d && { abierto: d.open, resumen: d.querySelector('summary').textContent, contiene: Boolean(d.querySelector('section.opec')) }; });
    const r = await art.evaluate((a) => {
      const s = a.querySelector('section.opec');
      if (!s) return null;
      const despues = (x, y) => Boolean(x && y && (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING));
      const rel = a.querySelector('details.relacionadas');
      const tabla = s.querySelector('table');
      return {
        h: s.querySelector('h3').textContent, etiqueta: s.getAttribute('aria-labelledby') === s.querySelector('h3').id,
        trasNota: despues(a.querySelector('.nota-validez'), s), antesRel: rel ? despues(s, rel) : true,
        fuente: s.querySelector('.src').textContent, aclaracion: s.querySelector('.hint').textContent,
        caption: tabla.querySelector('caption').textContent, enScroll: Boolean(tabla.closest('.tabla-scroll')),
        cols: Array.from(tabla.querySelectorAll('thead th')).map((t) => [t.textContent, t.getAttribute('scope')]),
        filas: Array.from(tabla.querySelectorAll('tbody tr')).map((tr) => [tr.querySelector('th').getAttribute('scope'), ...Array.from(tr.children).map((c) => c.textContent)]),
        borradores: Array.from(a.querySelectorAll('.src')).filter((x) => x.checkVisibility() && !x.closest('details:not([open])') && x.textContent.includes('· Borrador')).length,
        tipo: a.dataset.tipo, entidad: a.dataset.entidad
      };
    });
    const e = esperado(entidad);
    prueba(`caso ${n}: el bloque va plegado (fase 11), con el resumen «Vacantes en la OPEC (${e.total[3]})»`, plegable && !plegable.abierto && plegable.contiene && plegable.resumen === `Vacantes en la OPEC (${e.total[3]})`, JSON.stringify(plegable));
    prueba(`caso ${n}: hay bloque «Vacantes en la OPEC» después de la nota de validez y antes de «Otras fuentes relacionadas»`, r && r.h === 'Vacantes en la OPEC' && r.etiqueta && r.trasNota && r.antesRel && r.entidad === entidad, JSON.stringify(r && { h: r.h, trasNota: r.trasNota, antesRel: r.antesRel, entidad: r.entidad }));
    if (!r) continue;
    prueba(`caso ${n}: línea de fuente «Fuente: OPEC del proceso de selección, {entidad}, corte del ${FECHA}», sin «Borrador»`, r.fuente === `Fuente: OPEC del proceso de selección, ${entidad}, corte del ${FECHA}`, r.fuente);
    prueba(`caso ${n}: sigue habiendo exactamente un .src visible con «· Borrador»`, r.borradores === 1, String(r.borradores));
    prueba(`caso ${n}: aclaración de la sección 6`, r.aclaracion === `Cifras de la OPEC con corte del ${FECHA}. Pueden ser distintas de las del proyecto de acuerdo, que es anterior.`, r.aclaracion);
    prueba(`caso ${n}: tabla con caption, encabezados de columna y de fila, dentro de .tabla-scroll`, r.caption === `Vacantes por empleo en la OPEC de ${entidad}` && r.enScroll
      && JSON.stringify(r.cols) === JSON.stringify([['Empleo', 'col'], ['Sin reserva', 'col'], ['Con reserva para personas con discapacidad', 'col'], ['Total', 'col']]) && r.filas.every((f) => f[0] === 'row'), JSON.stringify(r.cols));
    const filas = r.filas.map((f) => f.slice(1));
    prueba(`caso ${n}: cada fila coincide con la suma de opec.json por empleo y modalidad`, JSON.stringify(filas.slice(0, -1)) === JSON.stringify(e.filas), JSON.stringify(filas.slice(0, 3)));
    prueba(`caso ${n}: fila «Total» ${e.total.slice(1).join(' / ')}, con separador de miles`, JSON.stringify(filas.at(-1)) === JSON.stringify(e.total), JSON.stringify(filas.at(-1)));
  }
  prueba('referencia del 7 de octubre: Antioquia 2.076 + 157 = 2.233 y Amazonas 36 + 3 = 39', opec.corte !== '2026-10-07' || (esperado(ANTIOQUIA).total.join() === 'Total,2.076,157,2.233' && esperado(AMAZONAS).total.join() === 'Total,36,3,39'));

  // Sin bloque: casos 1, 2, 5, 7 y 16, «Depende de su entidad», «No encontrado» y «Tema reservado»
  for (const n of [1, 2, 5, 7, 16, 3, 11, 12]) {
    await limpiarEntidad(pagina);
    const art = await preguntar(pagina, caso(n));
    prueba(`caso ${n} (${await art.getAttribute('data-tipo')}): sin bloque OPEC`, (await art.locator('section.opec').count()) === 0);
  }
  prueba('sin solicitudes de red y sin errores de consola', red.length === 0 && errores.length === 0, [...red, ...errores].join(' / '));
  await contexto.close();
}

/* 3. E1: elegir Antioquia en el buscador trae el bloque en la respuesta nueva */
{
  const { contexto, pagina } = await nueva();
  const art = await preguntar(pagina, caso(3));
  const buscador = art.locator('input[role="combobox"]');
  await buscador.fill('antio'); await buscador.press('ArrowDown'); await buscador.press('Enter');
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 2);
  const nueva2 = pagina.locator('#log article[data-tipo]').nth(1);
  const total = await nueva2.locator('section.opec tr.opec-total td').last().textContent().catch(() => '');
  prueba('E1: la respuesta nueva (Antioquia) trae el bloque con el total de opec.json', (await nueva2.getAttribute('data-entidad')) === ANTIOQUIA && total === esperado(ANTIOQUIA).total[3], total);
  await contexto.close();
}

/* 4. Detalle de un empleo, con teclado */
{
  const { contexto, pagina, errores, red } = await nueva();
  const art = await preguntar(pagina, caso(4));
  await art.locator('details.opec-plegable > summary').click(); // fase 11: el bloque va plegado
  const exterior = art.locator('details.opec-empleos');
  prueba('detalle: el desplegable exterior dice «Requisitos, funciones y número de OPEC de cada empleo» y nace cerrado',
    normaliza(await exterior.locator(':scope > summary').textContent()) === 'Requisitos, funciones y número de OPEC de cada empleo' && !(await exterior.evaluate((d) => d.open)));
  await exterior.locator(':scope > summary').focus(); await pagina.keyboard.press('Enter');
  const empleo = exterior.locator('details.opec-empleo', { has: pagina.locator('summary', { hasText: /^DOCENTE DE PRIMARIA$/ }) });
  await empleo.locator('summary').focus(); await pagina.keyboard.press('Enter');
  const d = await empleo.evaluate((x) => ({ abierto: x.open, h4: Array.from(x.querySelectorAll('h4')).map((h) => h.textContent), lis: Array.from(x.querySelectorAll('ul')).map((u) => Array.from(u.children).map((l) => l.textContent)), ps: Array.from(x.querySelectorAll('p')).map((p) => p.textContent), visible: x.querySelector('h4').checkVisibility() }));
  const emp = opec.entidades[ANTIOQUIA].empleos.find((e) => e.denominacion === 'DOCENTE DE PRIMARIA');
  const T = opec.textos;
  const opecs = emp.opec.map((o) => o.modalidad === 'reserva'
    ? `OPEC ${o.numero}: ${o.vacantes === 1 ? '1 vacante' : miles(o.vacantes) + ' vacantes'} con reserva para personas con discapacidad. Tipos de discapacidad: ${T[o.discapacidad]}`
    : `OPEC ${o.numero}: ${o.vacantes === 1 ? '1 vacante' : miles(o.vacantes) + ' vacantes'} sin reserva`);
  prueba('detalle: con Enter se abren el desplegable exterior y el empleo «DOCENTE DE PRIMARIA», y se ve', d.abierto && d.visible);
  prueba('detalle: subtítulos de la sección 6, en orden', JSON.stringify(d.h4) === JSON.stringify(['Número de OPEC y vacantes', 'Requisito de estudio', 'Requisito de experiencia', ...(emp.alternativas.length ? ['Alternativa de estudio y experiencia'] : []), 'Funciones']), JSON.stringify(d.h4));
  prueba('detalle: OPEC con vacantes, modalidad y tipos de discapacidad, iguales a opec.json', JSON.stringify(d.lis[0]) === JSON.stringify(opecs), JSON.stringify(d.lis[0]).slice(0, 200));
  prueba('detalle: estudio, experiencia, alternativas y funciones literales de opec.json',
    d.ps[0] === T[emp.estudio] && d.ps[1] === T[emp.experiencia] && d.ps[2] === T[emp.funciones] && JSON.stringify(d.lis[1] || []) === JSON.stringify(emp.alternativas.map((i) => T[i])));
  prueba('detalle: el texto de la OPEC no se transforma (sin text-transform)', await art.locator('section.opec').evaluate((s) => Array.from(s.querySelectorAll('*')).every((x) => getComputedStyle(x).textTransform === 'none')));
  prueba('detalle: sin solicitudes de red al abrir los desplegables y sin errores', red.length === 0 && errores.length === 0, [...red, ...errores].join(' / '));

  // Impresión: el exterior se abre; los empleos cerrados siguen cerrados; al terminar todo vuelve a su estado.
  await empleo.locator('summary').click(); // se cierra el empleo
  await exterior.locator(':scope > summary').click(); // se cierra el exterior
  await art.locator('[data-print]').click();
  const imp = await pagina.evaluate(() => window.__impreso);
  await pagina.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  const despues = await art.evaluate((a) => ({ exterior: a.querySelector('details.opec-empleos').open, empleos: a.querySelectorAll('details.opec-empleo[open]').length }));
  prueba('impresión: el desplegable exterior se abre y los empleos cerrados se imprimen cerrados', imp && imp.exterior === true && imp.empleosAbiertos.length === 0, JSON.stringify(imp));
  prueba('impresión: al terminar, los desplegables vuelven a su estado', !despues.exterior && despues.empleos === 0, JSON.stringify(despues));
  // Regiones vivas
  const vivas = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]')).map((e) => e.outerHTML.slice(0, 80)));
  prueba('dentro de #log no hay role="status", role="alert" ni aria-live (con el bloque OPEC)', vivas.length === 0, vivas.join(' / '));
  await contexto.close();
}

/* 5. Voz: la lectura automática no lee el bloque; «Escuchar» lee la tabla y no las funciones de un empleo cerrado */
{
  const { contexto, pagina } = await nueva({ prefs: { perfil: 'visual', lecturaAutomatica: true } });
  await preguntar(pagina, caso(4));
  await pagina.waitForTimeout(600);
  const leido = await pagina.evaluate(() => window.__leido.join(' '));
  prueba('lectura automática: no lee el bloque OPEC', leido.length > 0 && !leido.includes('Vacantes en la OPEC') && !leido.includes('OPEC del proceso de selección'), leido.slice(0, 160));
  await pagina.evaluate(() => speechSynthesis.cancel());
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  const art = await preguntar(pagina, caso(4));
  await pagina.waitForTimeout(400);
  await art.locator('details.opec-plegable > summary').click(); // fase 11: «Escuchar» lee lo que está abierto
  await pagina.evaluate(() => { window.__leido = []; });
  await art.locator('[data-speak]').click();
  await pagina.waitForTimeout(1500);
  const leido = await pagina.evaluate(() => window.__leido.join(' '));
  const emp = opec.entidades[ANTIOQUIA].empleos.find((e) => e.denominacion === 'DOCENTE DE PRIMARIA');
  const funciones = opec.textos[emp.funciones].slice(0, 60);
  prueba('«Escuchar»: la voz recibe el encabezado y las filas de la tabla OPEC', leido.includes('Vacantes en la OPEC') && leido.includes('DOCENTE DE PRIMARIA') && leido.includes(esperado(ANTIOQUIA).total[3]), leido.slice(-200));
  prueba('«Escuchar»: no lee las funciones de un empleo cerrado', !leido.includes(funciones));
  await pagina.evaluate(() => speechSynthesis.cancel());
  await contexto.close();
}

/* 6. Saludo */
{
  const { contexto, pagina } = await nueva();
  const p2 = await pagina.locator('#saludo article details.saludo-mas > p').first().textContent(); // fase 11: va en «Cómo respondo»
  prueba('saludo: el párrafo de las fuentes («Cómo respondo») nombra la OPEC con N y la fecha del corte leídos de los datos', p2 === `Respondo con los proyectos de acuerdo de las ${N} entidades, con el proyecto de anexo técnico y con la OPEC del ${FECHA}. En cada respuesta le muestro el texto oficial y de dónde sale.`, p2);
  await contexto.close();
}

await navegador.close();
const carpeta = path.join(raiz, 'pruebas', 'resultados');
mkdirSync(carpeta, { recursive: true });
writeFileSync(path.join(carpeta, 'opec.json'), JSON.stringify({ fecha: new Date().toISOString(), corte: opec.corte, resultados }, null, 2), 'utf8');
for (const r of resultados) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${r.ok ? '' : ' — ' + r.detalle}`);
const fallas = resultados.filter((r) => !r.ok).length;
console.log(`\nVacantes en la OPEC: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
if (fallas) process.exit(1);
