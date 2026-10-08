// Prueba de la fase 8: iconos, una sola columna, celular, caja de pregunta fija o estática, aviso corto, línea de fuente,
// resaltado, recuadro de resumen, opinión como grupo propio, copiar y saludo del chat.
// Playwright + axe-core, Chromium, archivo abierto con file://.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { icono, ICONOS } from '../src/js/iconos.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const kb = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'kb.json'), 'utf8'));
const temas = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'temas.json'), 'utf8'));
const N = kb.nAcuerdos;
// Fase 9: el saludo nombra la OPEC con la fecha de su corte (de opec.json).
const opec = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'opec.json'), 'utf8'));
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const FECHA_OPEC = ((a, m, d) => `${d} de ${MESES[m - 1]} de ${a}`)(...opec.corte.split('-').map(Number));
const nComun = (rotulo) => kb.modal.find((m) => m[0] === rotulo && m[2] === 0)[3];
const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: false, voz: '', velocidad: 'normal' };
const CONTRASTES = ['normal', 'oscuro', 'alto', 'alto-oscuro'];

const navegador = await chromium.launch();
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

async function nueva({ panel = {}, vista = true, viewport = { width: 1100, height: 900 }, prefs = {} } = {}) {
  const contexto = await navegador.newContext({ viewport });
  await contexto.addInitScript(({ panel, vista, prefs }) => {
    window.__leido = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { window.__leido.push(u.text); hablar(u); };
    window.__copiado = null;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: (t) => { window.__copiado = t; return Promise.resolve(); } }, configurable: true });
    window.__status = [];
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(() => window.__status.push(document.getElementById('status').textContent))
        .observe(document.getElementById('status'), { childList: true, characterData: true, subtree: true });
    });
    if (!sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify(panel));
      if (vista) localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true, ...prefs }));
    }
  }, { panel: { ...PRED, ...panel }, vista, prefs });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(url);
  return { contexto, pagina, errores };
}
const nRespuestas = (pagina) => pagina.locator('#log article[data-tipo]').count();
async function preguntar(pagina, texto) {
  const antes = await nRespuestas(pagina);
  await pagina.fill('#pregunta', texto);
  await pagina.press('#pregunta', 'Enter');
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
}
const ultima = (pagina) => pagina.locator('#log article[data-tipo]').last();
/** La respuesta que es la última ahora, fijada por posición (no cambia cuando llegan otras). */
const fijar = async (pagina) => pagina.locator('#log article[data-tipo]').nth((await nRespuestas(pagina)) - 1);
const CINCO = ['cuál es el puntaje mínimo para aprobar', 'cuantos dias tengo para reclamar los resultados de la prueba escrita', 'qué pasa en la audiencia de escogencia de vacante', 'cuánto cuesta la inscripción', 'quién gana el mundial de fútbol'];
const conCinco = async (pagina) => { for (const q of CINCO) await preguntar(pagina, q); await pagina.waitForTimeout(400); };
const normaliza = (t) => t.replace(/\s+/g, ' ').trim();

/* 1. Iconos y «Dictar» */
for (const contraste of CONTRASTES) {
  const { contexto, pagina, errores } = await nueva({ panel: { contraste } });
  const r = await pagina.evaluate(({ esperados }) => {
    const tarjetas = Array.from(document.querySelectorAll('.tema-tarjeta'));
    return tarjetas.map((t, i) => {
      const svg = t.querySelector('svg');
      const caja = svg.getBoundingClientRect();
      const texto = t.querySelector('.tema-texto').getBoundingClientRect();
      const d = document.createElement('div'); d.innerHTML = esperados[i];
      return { n: t.querySelectorAll('svg').length, cantTitle: svg.querySelectorAll('title, desc').length, aria: svg.getAttribute('aria-hidden'), foco: svg.getAttribute('focusable'),
        stroke: svg.getAttribute('stroke'), w: svg.getAttribute('width'), h: svg.getAttribute('height'), ancho: Math.round(caja.width),
        izquierda: caja.right <= texto.left + 1, igual: d.firstElementChild.outerHTML === svg.outerHTML, html: svg.outerHTML,
        color: getComputedStyle(svg).color, colorTitulo: getComputedStyle(t.querySelector('.tema-titulo')).color,
        trazo: getComputedStyle(svg).stroke, nombre: t.innerText.replace(/\s+/g, ' ').trim() };
    });
  }, { esperados: temas.map((t) => icono(t.icono)) });
  prueba(`iconos (${contraste}): cinco tarjetas, cada una con un solo icono decorativo (aria-hidden, sin title), trazo currentColor, 24 × 24 y 18 px visibles (fase 11)`,
    r.length === 5 && r.every((x) => x.n === 1 && x.cantTitle === 0 && x.aria === 'true' && x.foco === 'false' && x.stroke === 'currentColor' && x.w === '24' && x.h === '24' && x.ancho === 18), JSON.stringify(r.map((x) => [x.ancho, x.aria, x.stroke])));
  prueba(`iconos (${contraste}): están a la izquierda del texto y son los de iconos.js`, r.every((x) => x.izquierda && x.igual));
  prueba(`iconos (${contraste}): el color del trazo es el del título de la tarjeta (mismo contraste que el texto)`, r.every((x) => x.color === x.colorTitulo && x.trazo === x.colorTitulo), JSON.stringify(r.map((x) => [x.color, x.colorTitulo, x.trazo])));
  if (contraste === 'normal') {
    prueba('iconos: los cinco son distintos', new Set(r.map((x) => x.html)).size === 5);
    prueba('iconos: el nombre de cada tema es solo su título, sin el número de preguntas (fase 11)', r.every((x, i) => x.nombre === temas[i].titulo), JSON.stringify(r.map((x) => x.nombre)));
    prueba('iconos.js trae exactamente los cinco iconos del plan', JSON.stringify(Object.keys(ICONOS)) === JSON.stringify(['carpeta-lista', 'maletin', 'lapiz', 'documento-alerta', 'ruta']));
    const mic = await pagina.evaluate(() => { const b = document.getElementById('micBtn'); const s = b.querySelector('span'); const r = s.getBoundingClientRect(); return { texto: s.textContent, visible: r.width > 0 && r.height > 0, sr: s.classList.contains('sr-only'), pos: getComputedStyle(s).position, nombre: b.getAttribute('aria-label') }; });
    prueba('micrófono: muestra el texto «Dictar» (visible, no sr-only) y su nombre accesible lo contiene', mic.texto === 'Dictar' && mic.visible && !mic.sr && mic.pos !== 'absolute' && mic.nombre.includes('Dictar'), JSON.stringify(mic));
  }
  prueba(`iconos (${contraste}): sin errores de consola`, errores.length === 0, errores.join(' / '));
  await contexto.close();
}

/* 1a. Logo de la CNSC en la cabecera */
for (const [w, h, contraste] of [[320, 640, 'normal'], [390, 740, 'normal'], [1100, 900, 'normal'], [1100, 900, 'oscuro'], [1100, 900, 'alto'], [1100, 900, 'alto-oscuro']]) {
  const contexto = await navegador.newContext({ viewport: { width: w, height: h } });
  await contexto.addInitScript(({ contraste }) => {
    localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true }));
    localStorage.setItem('accesibilidad.preferencias', JSON.stringify({ version: 1, contraste, texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false, facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false, botonesEscuchar: false, voz: '', velocidad: 'normal' }));
  }, { contraste });
  const pagina = await contexto.newPage();
  const externas = [];
  pagina.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) externas.push(r.url()); });
  await pagina.goto(url);
  const r = await pagina.evaluate(() => {
    const i = document.querySelector('.logo-cnsc'); const c = i.getBoundingClientRect(); const cab = document.querySelector('header.top').getBoundingClientRect();
    const caja = (sel) => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
    const choca = (a, b) => !(a.left >= b.right - 0.5 || a.right <= b.left + 0.5 || a.top >= b.bottom - 0.5 || a.bottom <= b.top + 0.5);
    const onu = caja('.a11y-disparador'); const marca = caja('.earm-brand-mark'); const tools = caja('.tools'); const cc = { top: c.top, bottom: c.bottom, left: c.left, right: c.right };
    const columna = document.querySelector('main').getBoundingClientRect();
    return { alt: i.getAttribute('alt'), cargado: i.complete && i.naturalWidth > 0, datos: i.src.startsWith('data:image/png;base64,'), alto: Math.round(c.height), dentro: c.top >= cab.top - 1 && c.bottom <= cab.bottom + 1,
      izq: c.left, der: innerWidth - c.right, placa: getComputedStyle(i).backgroundColor, choqueOnu: getComputedStyle(document.querySelector('.a11y-disparador')).position === 'absolute' && choca(cc, onu), choqueMarca: choca(cc, marca),
      mismaFilaHerramientas: !(cc.bottom <= tools.top + 1 || cc.top >= tools.bottom - 1), izqHerramientas: cc.right <= tools.left + 1, bajoMarca: cc.top >= marca.bottom - 1, bajoLogo: tools.top >= cc.bottom - 1, mismaFilaMarca: !(cc.bottom <= marca.top + 1 || cc.top >= marca.bottom - 1), ancho: innerWidth };
  });
  const etiqueta = `${w} px, ${contraste}`;
  prueba(`logo CNSC (${etiqueta}): imagen con texto alternativo «Comisión Nacional del Servicio Civil», cargada, incrustada y de 44 px de alto (más su placa)`, r.alt === 'Comisión Nacional del Servicio Civil' && r.cargado && r.datos && r.alto >= 44 && r.dentro, JSON.stringify(r));
  prueba(`logo CNSC (${etiqueta}): sobre placa blanca (se lee en los cuatro contrastes) y con margen de 16 px a los lados`, r.placa === 'rgb(255, 255, 255)' && r.izq >= 15.5 && r.der >= 15.5, JSON.stringify(r));
  prueba(`logo CNSC (${etiqueta}): no choca con la marca ni con el botón de la ONU y respeta el orden de la cabecera (fase 11: en la fila de los botones, a su izquierda; en celular, debajo de la marca, y los botones a su derecha o, si no caben, debajo)`, !r.choqueOnu && !r.choqueMarca && (w < 640 ? r.bajoMarca && ((r.mismaFilaHerramientas && r.izqHerramientas) || r.bajoLogo) : r.mismaFilaHerramientas && r.izqHerramientas && r.mismaFilaMarca), JSON.stringify(r));
  prueba(`logo CNSC (${etiqueta}): sin solicitudes de red externas`, externas.length === 0, externas.join(', '));
  await contexto.close();
}

/* 1b. Texto de ayuda de la caja de pregunta: la advertencia de datos personales */
{
  const { contexto, pagina } = await nueva({ viewport: { width: 390, height: 740 } });
  const r = await pagina.evaluate(() => {
    const a = document.getElementById('ayuda-pregunta'); const t = document.getElementById('pregunta'); const b = a.getBoundingClientRect(); const e = t.getBoundingClientRect();
    return { texto: a.textContent, visible: b.width > 0 && b.height > 0, describe: t.getAttribute('aria-describedby').split(' '), antes: b.bottom <= e.top + 1, fuente: parseFloat(getComputedStyle(a).fontSize), modo: document.getElementById('form').dataset.modo };
  });
  prueba('ayuda de la caja de pregunta: «No escriba datos personales.», visible, encima de la caja y enlazada con aria-describedby', r.texto === 'No escriba datos personales.' && r.visible && r.antes && r.describe.includes('ayuda-pregunta') && r.describe.includes('status') && r.fuente >= 13.5, JSON.stringify(r));
  prueba('ayuda de la caja de pregunta: a 390 × 740 al 100 % la caja sigue siendo fija', r.modo === 'fijo', JSON.stringify(r));
  await contexto.close();
}

/* 2. Columna: ancho, centrado, orden */
for (const [w, h] of [[1280, 800], [1100, 900], [900, 800], [700, 800], [390, 740]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  const r = await pagina.evaluate(() => {
    const caja = (sel) => { const e = document.querySelector(sel); const b = e.getBoundingClientRect(); return { x: b.left, w: b.width, der: innerWidth - b.right }; };
    return { main: caja('main'), cabecera: caja('header .bar'), sw: document.documentElement.scrollWidth, vw: innerWidth };
  });
  const centrado = (c) => Math.abs(c.x - c.der) <= 1;
  prueba(`columna a ${w} px: main y cabecera de 800 px como máximo, centrados, sin desplazamiento horizontal`, r.main.w <= 800.5 && r.cabecera.w <= 800.5 && centrado(r.main) && centrado(r.cabecera) && r.sw <= r.vw + 1, JSON.stringify(r));
  await contexto.close();
}
for (const [w, h] of [[390, 740], [1280, 800]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  const r = await pagina.evaluate(() => {
    const top = (sel) => document.querySelector(sel).getBoundingClientRect().top;
    const orden = ['#saludo', '#temas', '#entidad-detalles', '.conversacion', '#form'].map((s) => document.querySelector(s));
    const dom = orden.every((e, i) => i === 0 || Boolean(orden[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
    return { dom, tops: ['#saludo', '#temas', '#entidad-detalles', '.conversacion'].map(top), abierto: document.getElementById('entidad-detalles').open,
      visible: document.getElementById('entidad').checkVisibility(), resumen: document.getElementById('entidad-resumen').textContent };
  });
  prueba(`orden a ${w} px: saludo, temas, entidad, conversación y formulario (orden del DOM y posición vertical de los cuatro primeros)`, r.dom && r.tops.every((t, i) => i === 0 || t > r.tops[i - 1]), JSON.stringify(r));
  prueba(`entidad a ${w} px: el selector va plegado, con el resumen «Su entidad (opcional)»`, !r.abierto && !r.visible && r.resumen === 'Su entidad (opcional)', JSON.stringify(r));
  await pagina.focus('#entidad-resumen');
  await pagina.keyboard.press('Enter');
  prueba(`entidad a ${w} px: con Enter se abre y se puede elegir`, (await pagina.locator('#entidad').isVisible()) && (await pagina.locator('#entidad-detalles').evaluate((d) => d.open)));
  await pagina.selectOption('#entidad', 'Secretaría de Educación Departamental de Antioquia');
  prueba(`entidad a ${w} px: la entidad elegida queda en el selector`, (await pagina.inputValue('#entidad')) === 'Secretaría de Educación Departamental de Antioquia');
  await contexto.close();
}

/* 3. Sin desplazamiento interno */
{
  const { contexto, pagina } = await nueva({ viewport: { width: 1100, height: 700 } });
  await conCinco(pagina);
  const r = await pagina.evaluate(() => {
    const internos = Array.from(document.querySelectorAll('main *')).filter((e) => e.tagName !== 'TEXTAREA' && !e.closest('.tabla-scroll, .buscador-entidad ul') && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY)).map((e) => e.tagName.toLowerCase() + '.' + e.className);
    return { internos, log: document.getElementById('log').getBoundingClientRect().height, ventana: innerHeight, scrollY: window.scrollY, documento: document.documentElement.scrollHeight };
  });
  prueba('sin desplazamiento interno: ningún contenedor de la columna tiene overflow-y auto o scroll', r.internos.length === 0, r.internos.join(', '));
  prueba('sin desplazamiento interno: #log crece más que la ventana y se desplaza la página', r.log > r.ventana && r.documento > r.ventana && r.scrollY > 0, JSON.stringify(r));
  await contexto.close();
}

/* 4. Caja de pregunta: fija, con sus excepciones */
const info = (pagina) => pagina.evaluate(() => {
  const f = document.getElementById('form'); const b = f.getBoundingClientRect();
  return { modo: f.dataset.modo, pos: getComputedStyle(f).position, fondo: b.bottom, top: b.top, alto: innerHeight, pie: document.querySelector('footer.foot').getBoundingClientRect().bottom, pieTop: document.querySelector('footer.foot').getBoundingClientRect().top, variable: getComputedStyle(document.documentElement).getPropertyValue('--alto-form').trim() };
});
{
  const { contexto, pagina } = await nueva({ viewport: { width: 390, height: 740 } });
  let i = await info(pagina);
  prueba('caja a 390 × 740 al 100 %, conversación vacía: fija y pegada al borde inferior', i.modo === 'fijo' && i.pos === 'fixed' && Math.abs(i.fondo - i.alto) <= 1, JSON.stringify(i));
  await conCinco(pagina);
  const posiciones = [];
  for (const y of ['arriba', 'mitad', 'final']) {
    await pagina.evaluate((y) => window.scrollTo(0, y === 'arriba' ? 0 : y === 'mitad' ? document.documentElement.scrollHeight / 2 : document.documentElement.scrollHeight), y);
    i = await info(pagina); posiciones.push(i);
  }
  prueba('caja a 390 × 740 con cinco respuestas: fija y pegada al borde inferior arriba, a la mitad y al final', posiciones.every((p) => p.modo === 'fijo' && p.pos === 'fixed' && Math.abs(p.fondo - p.alto) <= 1), JSON.stringify(posiciones.map((p) => p.fondo)));
  prueba('caja: con la página al final, el pie queda completo por encima de la caja', posiciones[2].pie <= posiciones[2].top + 1, JSON.stringify(posiciones[2]));
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar');
  await pagina.waitForTimeout(1200);
  const art = await pagina.evaluate(() => { const a = Array.from(document.querySelectorAll('#log article[data-tipo]')).pop().getBoundingClientRect(); return { top: a.top, form: document.getElementById('form').getBoundingClientRect().top }; });
  prueba('caja en celular: el comienzo de la respuesta nueva no queda tapado (top ≥ 0, con 1 px de tolerancia, y por encima de la caja)', art.top >= -1 && art.top < art.form, JSON.stringify(art));
  await pagina.evaluate(() => { document.getElementById('pregunta').style.height = '170px'; });
  await pagina.waitForTimeout(300);
  const crecida = await info(pagina);
  const altoReal = await pagina.evaluate(() => document.getElementById('form').getBoundingClientRect().height);
  prueba('caja: --alto-form sigue al alto real de la caja cuando crece', crecida.modo === 'fijo' ? Math.abs(parseFloat(crecida.variable) - altoReal) <= 2 : crecida.variable === '0px', JSON.stringify({ crecida, altoReal }));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ viewport: { width: 1280, height: 800 } });
  const i = await info(pagina);
  prueba('caja a 1280 × 800 al 100 %: fija y pegada al borde inferior', i.modo === 'fijo' && i.pos === 'fixed' && Math.abs(i.fondo - i.alto) <= 1, JSON.stringify(i));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ viewport: { width: 390, height: 740 }, panel: { texto: 200 } });
  await conCinco(pagina);
  const r = await pagina.evaluate(() => {
    const f = document.getElementById('form'); const fb = f.getBoundingClientRect();
    const ultimo = Array.from(document.querySelectorAll('#log article')).pop().getBoundingClientRect();
    const pie = document.querySelector('footer.foot').getBoundingClientRect();
    return { modo: f.dataset.modo, pos: getComputedStyle(f).position, interior: document.querySelector('.form-interior').offsetHeight, ventana: innerHeight, variable: getComputedStyle(document.documentElement).getPropertyValue('--alto-form').trim(), despues: fb.top + window.scrollY >= ultimo.bottom + window.scrollY - 1, antesPie: fb.bottom <= pie.top + 1 };
  });
  prueba('caja a 390 × 740 al 200 %: su alto supera un tercio de la ventana y pasa a estática, al final de la columna', r.interior > r.ventana / 3 && r.modo === 'estatico' && r.pos === 'static' && r.variable === '0px' && r.despues && r.antesPie, JSON.stringify(r));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ viewport: { width: 740, height: 390 } });
  const i = await info(pagina);
  prueba('caja a 740 × 390 (menos de 500 px de alto): estática', i.modo === 'estatico' && i.pos === 'static' && i.variable === '0px', JSON.stringify(i));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ viewport: { width: 390, height: 740 } });
  const modos = [(await info(pagina)).modo];
  await pagina.setViewportSize({ width: 740, height: 390 }); await pagina.waitForTimeout(200); modos.push((await info(pagina)).modo);
  await pagina.setViewportSize({ width: 390, height: 740 }); await pagina.waitForTimeout(200); modos.push((await info(pagina)).modo);
  prueba('caja: al girar la pantalla el modo cambia solo (fijo, estático, fijo)', JSON.stringify(modos) === JSON.stringify(['fijo', 'estatico', 'fijo']), JSON.stringify(modos));
  await contexto.close();
}

/* 5. Botón de la ONU */
const interseca = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
for (const [w, h] of [[320, 640], [360, 740], [390, 740], [639, 800]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  await conCinco(pagina);
  const r = await pagina.evaluate(() => {
    window.scrollTo(0, 0);
    const d = document.querySelector('.a11y-disparador'); const cs = getComputedStyle(d); const c = d.getBoundingClientRect(); const cab = document.querySelector('header.top').getBoundingClientRect();
    const rect = (sel) => Array.from(document.querySelectorAll(sel)).map((e) => { const b = e.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; });
    const choques = [];
    for (const sel of ['.earm-brand-mark', '.brand-texto', '.tools .btn', '.logo-cnsc']) for (const b of rect(sel)) if (!(c.left >= b.right - 0.5 || c.right <= b.left + 0.5 || c.top >= b.bottom - 0.5 || c.bottom <= b.top + 0.5)) choques.push(sel);
    return { pos: cs.position, dentro: c.top >= cab.top - 1 && c.bottom <= cab.bottom + 1, ancho: c.width, alto: c.height, choques, derecha: innerWidth - c.right };
  });
  prueba(`ONU a ${w} px: va en la cabecera (position absolute), mide al menos 44 px y no choca con la marca ni con los botones`, r.pos === 'absolute' && r.dentro && r.ancho >= 44 && r.alto >= 44 && r.choques.length === 0 && Math.abs(r.derecha - 16) <= 1, JSON.stringify(r));
  const sobre = await pagina.evaluate(() => {
    const d = document.querySelector('.a11y-disparador');
    const sels = '#pregunta, #micBtn, button[type="submit"], .tema-tarjeta, #saludo article, #log article, #temas-alternar';
    const fallas = [];
    for (const y of [0, document.documentElement.scrollHeight / 2, document.documentElement.scrollHeight]) {
      window.scrollTo(0, y);
      const c = d.getBoundingClientRect();
      for (const e of document.querySelectorAll(sels)) { const b = e.getBoundingClientRect(); if (b.width > 0 && !(c.left >= b.right - 0.5 || c.right <= b.left + 0.5 || c.top >= b.bottom - 0.5 || c.bottom <= b.top + 0.5)) fallas.push(`${e.tagName.toLowerCase()}#${e.id}@${Math.round(y)}`); }
    }
    return fallas;
  });
  prueba(`ONU a ${w} px: con la página arriba, a la mitad y al final no cubre ningún control ni respuesta`, sobre.length === 0, sobre.join(', '));
  await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await pagina.waitForTimeout(700);
  await pagina.click('#btn-accesibilidad');
  await pagina.waitForSelector('.a11y-panel--abierto');
  await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); // el botón vive arriba de la página
  await pagina.waitForTimeout(400);
  const encima = await pagina.evaluate(() => { const c = document.querySelector('.a11y-disparador').getBoundingClientRect(); const e = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2); return { ok: Boolean(e && e.closest('.a11y-panel')), sy: window.scrollY, c: [c.left, c.top, c.right, c.bottom].map(Math.round), el: e ? e.tagName + '.' + e.className : null }; });
  prueba(`ONU a ${w} px: con el panel abierto, el panel queda por encima del botón`, encima.ok, JSON.stringify(encima));
  await pagina.keyboard.press('Escape');
  await pagina.keyboard.press('Alt+a');
  prueba(`ONU a ${w} px: Alt + A abre el panel`, await pagina.locator('#a11y-panel').isVisible());
  await contexto.close();
}
for (const [w, h] of [[640, 800], [641, 800], [800, 800], [1024, 800], [1280, 800]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  const r = await pagina.evaluate(() => {
    const d = document.querySelector('.a11y-disparador'); const c = d.getBoundingClientRect();
    const choques = [];
    for (const e of document.querySelectorAll('#pregunta, #micBtn, button[type="submit"]')) { const b = e.getBoundingClientRect(); if (!(c.left >= b.right - 0.5 || c.right <= b.left + 0.5 || c.top >= b.bottom - 0.5 || c.bottom <= b.top + 0.5)) choques.push(e.id || e.type); }
    return { pos: getComputedStyle(d).position, choques };
  });
  prueba(`ONU a ${w} px: flota (position fixed) y no tapa los controles del formulario`, r.pos === 'fixed' && r.choques.length === 0, JSON.stringify(r));
  await contexto.close();
}

/* 6. Cabecera: margen lateral de 16 px */
for (const [w, h] of [[320, 640], [360, 740], [390, 740], [1100, 900]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  const r = await pagina.evaluate(() => {
    const marca = document.querySelector('.earm-brand-mark').getBoundingClientRect();
    const botones = Array.from(document.querySelectorAll('.tools .btn, .a11y-disparador, .logo-cnsc')).filter((e) => getComputedStyle(e).position !== 'fixed').map((e) => e.getBoundingClientRect().right);
    return { izquierda: marca.left, derecha: innerWidth - Math.max(...botones) };
  });
  prueba(`cabecera a ${w} px: margen de 16 px o más a los lados`, r.izquierda >= 15.5 && r.derecha >= 15.5, JSON.stringify(r));
  await contexto.close();
}

/* 7. El saludo va primero (no hay aviso inicial) */
for (const [w, h] of [[390, 740], [1280, 800]]) {
  const { contexto, pagina } = await nueva({ viewport: { width: w, height: h } });
  const r = await pagina.evaluate(() => {
    const s = document.getElementById('saludo'); const sb = s.getBoundingClientRect(); const tb = document.getElementById('temas').getBoundingClientRect();
    const cab = document.querySelector('header.top').getBoundingClientRect();
    return { dentroDelLog: Boolean(document.querySelector('#log #saludo, #log article:not([data-tipo])')), aviso: Boolean(document.getElementById('aviso') || document.getElementById('aviso-alternar')), texto: document.body.innerText.includes('Prototipo con documentos en borrador'),
      primero: sb.top > cab.bottom - 1 && sb.top < tb.top, hijo: s.querySelectorAll('article.msg.bot').length, h: s.querySelector('p strong') ? s.querySelector('p strong').textContent : '' };
  });
  prueba(`saludo a ${w} px: es lo primero de la página, arriba de los temas, y fuera de la conversación`, r.primero && r.hijo === 1 && !r.dentroDelLog && r.h.startsWith('Hola. Soy el asistente'), JSON.stringify(r));
  prueba(`aviso inicial a ${w} px: ya no existe (ni el botón «Ver más» ni la frase «Prototipo con documentos en borrador»)`, !r.aviso && !r.texto, JSON.stringify(r));
  await contexto.close();
}

/* 8. Fuente en una línea, resaltado, resumen y opinión */
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  const caso = async (pregunta) => { await preguntar(pagina, pregunta); return ultima(pagina); };
  const lineas = async (art) => art.evaluate((a) => Array.from(a.querySelectorAll('.src')).filter((s) => s.getClientRects().length > 0 && !s.closest('details:not([open])')).map((s) => s.innerText.replace(/\s+/g, ' ').trim()));
  const nPuntaje = nComun('Artículo 13, Parágrafo segundo');
  let art = await caso('¿cuál es el puntaje mínimo para aprobar?');
  let l = await lineas(art);
  prueba('fuente (caso 1, texto común): formato de una línea', l[0] === `Fuente: Proyectos de Acuerdo de convocatoria, Artículo 13, Parágrafo segundo · común a ${nPuntaje} de ${N} acuerdos · Borrador`, JSON.stringify(l));
  art = await caso('cuantos dias tengo para reclamar los resultados de la prueba escrita');
  l = await lineas(art);
  prueba('fuente (caso 2, anexo): formato de una línea', l[0] === 'Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 2.7 · Borrador', JSON.stringify(l));
  art = await caso('cuantas vacantes ofrece Antioquia');
  l = await lineas(art);
  prueba('fuente (caso 4, acuerdo de una entidad): formato de una línea', l[0] === 'Fuente: Proyecto de Acuerdo de Secretaría de Educación Departamental de Antioquia, Artículo 8 · Borrador', JSON.stringify(l));
  await pagina.evaluate(() => { document.getElementById('entidad').value = ''; }); // la entidad de Antioquia sigue elegida
  art = await caso('me puedo inscribir a dos empleos');
  await art.evaluate((a) => { a.querySelector('details.texto-oficial').open = true; }); // fase 11: la segunda fuente va en «Ver texto oficial»
  l = await lineas(art);
  const nQuinto = nComun('Artículo 8, Parágrafo quinto');
  prueba('fuente (caso 5, dos fuentes): la primera completa y la segunda visible sin «· Borrador»', l.length === 2 && l[0] === `Fuente: Proyectos de Acuerdo de convocatoria, Artículo 8, Parágrafo quinto · común a ${nQuinto} de ${N} acuerdos · Borrador` && l[1] === 'Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 1.2.5', JSON.stringify(l));
  art = await caso('qué pasa en la audiencia de escogencia de vacante');
  l = await lineas(art);
  prueba('fuente (caso 7, pasaje): formato de una línea', l[0] === 'Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 7.3 · Borrador', JSON.stringify(l));
  prueba('fuente: ninguna insignia (.badge) en toda la página', (await pagina.locator('.badge').count()) === 0);
  const unaSola = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log article[data-tipo]')).map((a) => Array.from(a.querySelectorAll('.src')).filter((s) => s.getClientRects().length > 0 && !s.closest('details:not([open])') && /· Borrador/.test(s.textContent)).length));
  prueba('fuente: en cada respuesta, exactamente una fuente visible lleva «· Borrador»', unaSola.every((n) => n === 1), JSON.stringify(unaSola));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  const marcas = (a) => a.evaluate((el) => Array.from(el.querySelectorAll('mark')).map((m) => { const o = m.closest('.official'); const h = o && o.previousElementSibling; return { enFrases: Boolean(h && h.tagName === 'H3' && h.textContent === 'Lo más relevante del texto oficial'), enDesplegable: Boolean(m.closest('details')) }; }));
  for (const [n, q] of [[1, '¿cuál es el puntaje mínimo para aprobar?'], [2, 'cuantos dias tengo para reclamar los resultados de la prueba escrita'], [5, 'me puedo inscribir a dos empleos'], [10, 'las personas con discapacidad pagan'], [14, '¿Cómo pago los derechos de participación?'], [16, '¿Qué pruebas se aplican y cuánto vale cada una?']]) {
    await preguntar(pagina, q);
    prueba(`resaltado (caso ${n}, pregunta frecuente): ningún mark`, (await marcas(ultima(pagina))).length === 0);
  }
  let hubo = false;
  for (const [n, q] of [[7, 'qué pasa en la audiencia de escogencia de vacante'], [8, 'en qué ciudades se presentan las pruebas'], [9, 'cuántas vacantes de docente de preescolar hay en Amazonas']]) {
    await preguntar(pagina, q);
    const m = await marcas(ultima(pagina));
    if (m.length) hubo = true;
    prueba(`resaltado (caso ${n}, pasaje): los mark solo están en las frases clave`, m.every((x) => x.enFrases && !x.enDesplegable), JSON.stringify(m));
  }
  prueba('resaltado: en los pasajes sí se resaltan las frases clave (al menos en un caso)', hubo);
  // Resumen
  await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  const faqArt = await fijar(pagina);
  const r = await faqArt.evaluate((a) => { const rs = a.querySelectorAll('.resumen'); const x = rs[0]; const of = a.querySelector('.official'); return { n: rs.length, h3: x && x.querySelector('h3') && x.querySelector('h3').textContent, plain: Boolean(x && x.querySelector('p.plain')), srcFuera: !x.contains(a.querySelector('.src')), dentroOficial: Boolean(x.closest('.official')), bordeResumen: parseFloat(getComputedStyle(x).borderTopWidth), bordeOficial: parseFloat(getComputedStyle(of).borderTopWidth), anterior: Boolean(x.compareDocumentPosition(a.querySelector('.src')) & Node.DOCUMENT_POSITION_FOLLOWING) }; });
  const h3sr = await faqArt.evaluate((a) => a.querySelector('.resumen h3').classList.contains('sr-only'));
  prueba('resumen: «En pocas palabras» (solo para lectores de pantalla) y su párrafo, con la fuente fuera y debajo', r.n === 1 && r.h3 === 'En pocas palabras' && h3sr && r.plain && r.srcFuera && r.anterior, JSON.stringify(r));
  prueba('resumen: sin recuadro propio (fase 11) y fuera del texto oficial', r.bordeResumen === 0 && !r.dentroOficial, JSON.stringify(r));
  await preguntar(pagina, 'qué pasa en la audiencia de escogencia de vacante');
  prueba('resumen: las respuestas de pasaje no lo llevan', (await ultima(pagina).locator('.resumen').count()) === 0);
  // Opinión
  const op = async (art) => art.evaluate((a) => { const o = a.querySelector('.opinion'); if (!o) return null; const nombre = document.getElementById(o.getAttribute('aria-labelledby')).textContent; return { rol: o.getAttribute('role'), nombre, botones: Array.from(o.querySelectorAll('button')).map((b) => b.textContent), acciones: Array.from(a.querySelectorAll('.actions button')).map((b) => b.textContent), separados: !o.closest('.actions') && !a.querySelector('.actions').contains(o) }; });
  const o1 = await op(faqArt);
  prueba('opinión (pregunta frecuente): grupo «¿Le sirvió esta respuesta?» con «Sí» y «No», separado de Copiar e Imprimir', o1 && o1.rol === 'group' && o1.nombre === '¿Le sirvió esta respuesta?' && JSON.stringify(o1.botones) === JSON.stringify(['Sí', 'No']) && !o1.acciones.some((t) => /sirvió/i.test(t)) && o1.separados, JSON.stringify(o1));
  const o2 = await op(ultima(pagina));
  prueba('opinión (pasaje): también lleva el grupo', o2 && o2.botones.length === 2);
  await faqArt.locator('.opinion [data-ok]').click();
  prueba('opinión «Sí»: anuncia «Gracias por su opinión.» y deshabilita ambos botones', (await pagina.textContent('#status')) === 'Gracias por su opinión.' && (await faqArt.locator('.opinion button:disabled').count()) === 2);
  const bitAntes = await pagina.evaluate(() => (JSON.parse(localStorage.getItem('bitacora') || '[]')).length);
  await ultima(pagina).locator('.opinion [data-no]').click();
  const bit = await pagina.evaluate(() => JSON.parse(localStorage.getItem('bitacora') || '[]'));
  prueba('opinión «No»: registra «No le sirvió la respuesta» en la bitácora, anuncia el texto y deshabilita ambos', bit.length === bitAntes + 1 && bit.at(-1).motivo === 'No le sirvió la respuesta' && (await pagina.textContent('#status')) === 'Gracias por su opinión.' && (await ultima(pagina).locator('.opinion button:disabled').count()) === 2, JSON.stringify(bit.at(-1)));
  await pagina.evaluate(() => { document.getElementById('entidad').value = ''; });
  for (const [q, nombre] of [['¿cuántas vacantes hay?', 'Depende de su entidad'], ['quién gana el mundial de fútbol', 'No encontrado'], ['cuánto cuesta la inscripción', 'Tema reservado']]) {
    await preguntar(pagina, q);
    prueba(`opinión: «${nombre}» no lleva el grupo`, (await ultima(pagina).locator('.opinion').count()) === 0);
  }
  prueba('opinión: el saludo del chat no lleva el grupo', (await pagina.locator('#saludo article').locator('.opinion').count()) === 0);
  await contexto.close();
}

/* 9. Copiar */
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  const art = ultima(pagina);
  const resumen = await art.locator('.resumen .plain').textContent();
  await art.locator('[data-copy]').click();
  const copiado = await pagina.evaluate(() => window.__copiado);
  prueba('copiar: el texto incluye el resumen y no incluye los botones, la opinión ni el aviso de voz', Boolean(copiado) && copiado.includes('En pocas palabras') && copiado.includes(resumen.slice(0, 40)) && !/Copiar|Imprimir|Escuchar|¿Le sirvió esta respuesta\?|Este equipo no tiene instalada/.test(copiado), (copiado || '').slice(0, 200));
  prueba('copiar: los grupos de botones vuelven a mostrarse', await art.evaluate((a) => ['.actions', '.opinion'].every((s) => a.querySelector(s).style.display === '')));
  await contexto.close();
}

/* 10. Saludo del chat */
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  await pagina.waitForTimeout(500);
  const esperado = [
    'Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.',
    `Respondo con los proyectos de acuerdo de las ${N} entidades, con el proyecto de anexo técnico y con la OPEC del ${FECHA_OPEC}. En cada respuesta le muestro el texto oficial y de dónde sale.`,
    'Puede elegir un tema o escribir su pregunta. Si la respuesta depende de su entidad, se la pediré en ese momento.',
    'Para cambiar el tamaño de la letra, el contraste o escuchar las respuestas, use el botón Accesibilidad.'
  ];
  const art = pagina.locator('#saludo article');
  const visibles = [esperado[0], 'Elija un tema o escriba su pregunta.'];
  const ps = await art.evaluate((a) => Array.from(a.querySelectorAll(':scope > p:not(.sin-voz)')).map((p) => ({ texto: p.textContent, negrita: Boolean(p.querySelector('strong')) && p.querySelector('strong').textContent === p.textContent })));
  prueba('saludo: dos párrafos visibles con el texto de la sección 6 (fase 11), el primero en negrita', ps.length === 2 && ps.every((p, i) => p.texto === visibles[i]) && ps[0].negrita && !ps[1].negrita, JSON.stringify(ps.map((p) => p.texto.slice(0, 40))));
  const mas = await art.evaluate((a) => { const d = a.querySelector(':scope > details.saludo-mas'); return d && { abierto: d.open, resumen: d.querySelector('summary').textContent, ps: Array.from(d.querySelectorAll('p')).map((p) => p.textContent) }; });
  prueba('saludo: «Cómo respondo» cerrado, con los otros tres párrafos sin cambios y N leído de kb.json', mas && !mas.abierto && mas.resumen === 'Cómo respondo' && JSON.stringify(mas.ps) === JSON.stringify(esperado.slice(1)), JSON.stringify(mas));
  prueba('saludo: sin «Copiar» ni «Imprimir» (fase 11)', (await art.locator('[data-copy], [data-print]').count()) === 0);
  prueba('saludo: ya no menciona el panel «Antes de preguntar» y no es una respuesta (sin data-tipo)', !(await art.innerText()).includes('Antes de preguntar') && (await art.getAttribute('data-tipo')) === null);
  prueba('saludo: no se lee solo al cargar', (await pagina.evaluate(() => window.__leido.length)) === 0);
  await art.locator('[data-speak]').click();
  await pagina.waitForTimeout(700);
  const leido = normaliza(await pagina.evaluate(() => window.__leido.join(' ')));
  prueba('saludo: con «Escuchar», la voz recibe los dos párrafos visibles', visibles.every((p) => leido.includes(normaliza(p))), leido.slice(0, 160));
  await pagina.evaluate(() => speechSynthesis.cancel());
  await contexto.close();
}
{
  // Lectura automática (perfil Visual): sigue leyendo el resumen y la fuente
  const { contexto, pagina } = await nueva({ prefs: { perfil: 'visual', lecturaAutomatica: true } });
  await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  await pagina.waitForTimeout(600);
  const leido = await pagina.evaluate(() => window.__leido.join(' '));
  prueba('lectura automática: lee «En pocas palabras» y la línea de la fuente', /aptitudes/i.test(leido) && /Fuente: Proyectos de Acuerdo/.test(leido) && !/Texto oficial\./.test(leido), leido.slice(0, 160));
  await pagina.evaluate(() => speechSynthesis.cancel());
  await contexto.close();
}

/* 10b. Voz latinoamericana: el aviso aparece solo si no hay ninguna voz latina instalada */
{
  const caso = async (voces) => {
    const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
    await contexto.addInitScript(({ voces }) => {
      localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true }));
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify({ version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false, facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false, botonesEscuchar: true, voz: '', velocidad: 'normal' }));
      Object.defineProperty(speechSynthesis, 'getVoices', { value: () => voces.map((v) => ({ ...v, voiceURI: v.name, default: false })) });
    }, { voces });
    const pagina = await contexto.newPage();
    await pagina.goto(url);
    await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar');
    const art = ultima(pagina);
    const r = { boton: await art.locator('[data-speak]').isDisabled(), aviso: await art.locator('.sin-voz').isVisible(), texto: (await art.locator('.sin-voz').textContent()).trim(),
      lista: await (async () => { await pagina.click('#btn-accesibilidad'); await pagina.waitForSelector('.a11y-panel--abierto'); return pagina.locator('#a11y-voz option').allTextContents(); })() };
    await contexto.close();
    return r;
  };
  const textoEspana = 'Este equipo solo tiene voces de España. Para una voz latinoamericana, en Windows agregue voces en Configuración, Hora e idioma, Voz y elija «Español (México)»; en Android y en iPhone, elíjala en los ajustes de texto a voz.';
  const soloEspana = await caso([{ name: 'Helena (España)', lang: 'es-ES', localService: true }, { name: 'Pablo (España)', lang: 'es-ES', localService: true }]);
  prueba('voz: con solo voces de España, «Escuchar» se puede usar y aparece el aviso de voces latinoamericanas', !soloEspana.boton && soloEspana.aviso && soloEspana.texto === textoEspana, JSON.stringify(soloEspana));
  const mexicana = await caso([{ name: 'Helena (España)', lang: 'es-ES', localService: true }, { name: 'Sabina (México)', lang: 'es-MX', localService: true }]);
  prueba('voz: con una voz latinoamericana instalada, el aviso no aparece y la lista del panel la ofrece primero', !mexicana.boton && !mexicana.aviso && mexicana.lista[0].startsWith('Sabina'), JSON.stringify(mexicana));
  const colombiana = await caso([{ name: 'Helena (España)', lang: 'es-ES', localService: true }, { name: 'Sabina (México)', lang: 'es-MX', localService: true }, { name: 'Soledad (Colombia)', lang: 'es-CO', localService: true }]);
  prueba('voz: con una voz colombiana instalada, el panel la ofrece antes que las demás y no aparece el aviso', !colombiana.aviso && colombiana.lista[0].startsWith('Soledad') && colombiana.lista[1].startsWith('Sabina') && colombiana.lista[2].startsWith('Helena'), JSON.stringify(colombiana));
  const generica = await caso([{ name: 'Voz (es)', lang: 'es', localService: true }]);
  prueba('voz: una voz «es» sin país no cuenta como latinoamericana', generica.aviso && generica.texto === textoEspana, JSON.stringify(generica));
}

/* 10c. Textos del 8 de octubre de 2026: sin la promesa de un «equipo temático» que revisa cada pregunta */
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  await preguntar(pagina, 'quién gana el mundial de fútbol');
  const art = await fijar(pagina);
  const ps = await art.locator(':scope > p').allTextContents();
  prueba('«No encontrado»: segundo párrafo con el texto aprobado y sin «equipo temático» ni «quedó registrada»',
    ps.includes('Puede intentar con otras palabras, elegir uno de los temas o consultar los canales de atención de la CNSC.') && !(await art.innerText()).match(/equipo temático|quedó registrada/), JSON.stringify(ps));
  await pagina.evaluate(() => { window.__leido = []; });
  await art.locator('[data-speak]').click();
  await pagina.waitForTimeout(600);
  const leido = normaliza(await pagina.evaluate(() => window.__leido.join(' ')));
  prueba('«No encontrado»: la lectura en voz alta no menciona al «equipo temático»', leido.length > 0 && !/equipo temático|quedó registrada/.test(leido), leido.slice(0, 160));
  await pagina.evaluate(() => speechSynthesis.cancel());
  const ayuda = normaliza(await pagina.locator('#dlg .hint').first().textContent());
  prueba('panel de la bitácora: ayuda con el texto aprobado', ayuda === 'Aquí quedan las preguntas que el asistente no pudo resolver con las fuentes y las respuestas en las que se eligió «No». Se guardan solo en este navegador y no se envían a nadie. Los números largos se ocultan para proteger datos personales.', ayuda);
  prueba('ningún texto de la página menciona al «equipo temático»', !(await pagina.content()).includes('equipo temático'));
  await contexto.close();
}

/* 10d. Fase 11: diseño minimalista */
const luminancia = (rgb) => { const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const variante of CONTRASTES) {
  const { contexto, pagina, errores } = await nueva({ panel: { contraste: variante } });
  await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  const r = await pagina.evaluate(() => {
    const u = document.querySelector('#log .msg.user'), b = document.querySelector('#log .msg.bot'), col = document.querySelector('#log').getBoundingClientRect();
    const cs = (e) => getComputedStyle(e); const raiz = cs(document.documentElement);
    const radios = (e) => ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map((k) => parseFloat(cs(e)[k]));
    const prueba = document.createElement('span'); document.body.appendChild(prueba);
    const color = (v) => { prueba.style.color = `var(${v})`; return getComputedStyle(prueba).color; };
    const out = { fondoU: cs(u).backgroundColor, fondoB: cs(b).backgroundColor, derU: Math.abs(u.getBoundingClientRect().right - col.right) <= 1, izqB: Math.abs(b.getBoundingClientRect().left - col.left) <= 1,
      radU: radios(u), radB: radios(b), bordeB: parseFloat(cs(b).borderTopWidth), texto: color('--texto'), secundario: color('--texto-secundario'), enlace: color('--enlace'), cuerpo: cs(document.body).backgroundColor, superficie: color('--superficie'),
      orbes: [cs(document.body, '::before'), cs(document.body, '::after')].map((x) => x.content), antes: getComputedStyle(document.body, '::before').display, despues: getComputedStyle(document.body, '::after').display };
    prueba.remove(); return out;
  });
  const c = ['texto', 'secundario', 'enlace'].map((k) => Math.round(contraste(r[k], r.fondoB) * 10) / 10);
  prueba(`burbujas (${variante}): persona a la derecha y asistente a la izquierda, con fondos distintos`, r.derU && r.izqB && r.fondoU !== r.fondoB, JSON.stringify([r.fondoU, r.fondoB, r.derU, r.izqB]));
  prueba(`burbujas (${variante}): esquinas 18/18/4/18 (persona) y 18/18/18/4 (asistente)`, JSON.stringify(r.radU) === '[18,18,4,18]' && JSON.stringify(r.radB) === '[18,18,18,4]', JSON.stringify([r.radU, r.radB]));
  prueba(`burbujas (${variante}): texto, texto secundario y enlaces con contraste ≥ 4,5:1 sobre la burbuja del asistente`, c.every((x) => x >= 4.5), JSON.stringify(c));
  if (variante.startsWith('alto')) prueba(`burbujas (${variante}): la del asistente tiene borde de 2 px`, r.bordeB === 2, String(r.bordeB));
  prueba(`fondo plano (${variante}): sin orbes decorativas y con el fondo de la superficie`, r.cuerpo === r.superficie && r.orbes.every((x) => x === 'none' || x === 'normal'), JSON.stringify([r.cuerpo, r.superficie, r.orbes]));
  prueba(`fase 11 (${variante}): sin errores de consola`, errores.length === 0, errores.join(' / '));
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ viewport: { width: 1280, height: 900 } });
  // Temas como burbujas
  const t = await pagina.evaluate(() => Array.from(document.querySelectorAll('.tema-tarjeta')).map((e) => { const b = e.getBoundingClientRect(); return { alto: b.height, radio: parseFloat(getComputedStyle(e).borderTopLeftRadius), top: Math.round(b.top) }; }));
  prueba('temas: burbujas de 44 px o más de alto, con bordes redondeados (≥ 22 px), en a lo sumo dos filas a 1280 px', t.length === 5 && t.every((x) => x.alto >= 44 && x.radio >= 22) && new Set(t.map((x) => x.top)).size <= 2, JSON.stringify(t));
  prueba('temas: título «Temas»', (await pagina.textContent('#temas-titulo')) === 'Temas');
  // Cabecera de una fila y «Más»
  const cab = await pagina.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const m = r('.earm-brand-mark'), l = r('.logo-cnsc'), a = r('#btn-accesibilidad'), x = r('#btn-mas'); const fila = (p, q) => !(p.bottom <= q.top || p.top >= q.bottom); return { unaFila: fila(m, l) && fila(l, a) && fila(a, x), version: Boolean(document.querySelector('header .earm-version')) }; });
  prueba('cabecera a 1280 px: marca, logo, «Accesibilidad» y «Más» en una sola fila, sin la versión', cab.unaFila && !cab.version, JSON.stringify(cab));
  const mas = pagina.locator('#btn-mas');
  prueba('«Más»: botón con aria-expanded="false" y aria-controls="menu-mas", menú oculto', (await mas.getAttribute('aria-expanded')) === 'false' && (await mas.getAttribute('aria-controls')) === 'menu-mas' && (await pagina.locator('#menu-mas').isHidden()));
  await mas.focus(); await pagina.keyboard.press('Enter');
  const abierto = await pagina.evaluate(() => ({ exp: document.getElementById('btn-mas').getAttribute('aria-expanded'), visible: document.getElementById('menu-mas').checkVisibility(), altos: Array.from(document.querySelectorAll('#menu-mas .btn')).map((b) => b.getBoundingClientRect().height), textos: Array.from(document.querySelectorAll('#menu-mas .btn')).map((b) => b.textContent) }));
  prueba('«Más» con Enter: se abre con «Perfil» y «Bitácora», de 44 px o más', abierto.exp === 'true' && abierto.visible && JSON.stringify(abierto.textos) === '["Perfil","Bitácora"]' && abierto.altos.every((h) => h >= 44), JSON.stringify(abierto));
  await pagina.keyboard.press('Escape');
  prueba('«Más»: Escape lo cierra y devuelve el foco a «Más»', (await mas.getAttribute('aria-expanded')) === 'false' && (await pagina.evaluate(() => document.activeElement.id)) === 'btn-mas');
  await mas.click(); await pagina.mouse.click(5, 600);
  prueba('«Más»: un clic fuera lo cierra', (await mas.getAttribute('aria-expanded')) === 'false' && (await pagina.locator('#menu-mas').isHidden()));
  await mas.click(); await pagina.click('#logBtn');
  prueba('«Bitácora» desde «Más»: abre la bitácora y cierra el menú', (await pagina.locator('#dlg').isVisible()) && (await pagina.locator('#menu-mas').isHidden()));
  await pagina.click('#dlgClose');
  // El foco se mueve en el evento «close» del diálogo, que el navegador dispara en una tarea posterior.
  const focoMas = await pagina.waitForFunction(() => document.activeElement.id === 'btn-mas', null, { timeout: 1000 }).then(() => true, () => false);
  prueba('al cerrar la bitácora, el foco vuelve a «Más»', focoMas, await pagina.evaluate(() => document.activeElement.id));
  // Caja de pregunta
  const caja = await pagina.evaluate(() => ({ etiqueta: document.getElementById('pregunta-etiqueta').textContent, ayuda: document.getElementById('pregunta').getAttribute('aria-describedby').includes('ayuda-pregunta'), alto: document.getElementById('pregunta').getBoundingClientRect().height, botones: Array.from(document.querySelectorAll('#micBtn, #form button[type="submit"]')).map((b) => b.getBoundingClientRect().height) }));
  prueba('caja: etiqueta «Su pregunta», ayuda enlazada, 44 px o más, y «Dictar» y «Enviar» de 44 px o más', caja.etiqueta === 'Su pregunta' && caja.ayuda && caja.alto >= 44 && caja.botones.every((h) => h >= 44), JSON.stringify(caja));
  await pagina.fill('#pregunta', 'línea\n'.repeat(3)); await pagina.dispatchEvent('#pregunta', 'input');
  const alto3 = await pagina.evaluate(() => document.getElementById('pregunta').getBoundingClientRect().height);
  await pagina.fill('#pregunta', 'línea\n'.repeat(20)); await pagina.dispatchEvent('#pregunta', 'input');
  const alto20 = await pagina.evaluate(() => document.getElementById('pregunta').getBoundingClientRect().height);
  prueba('caja: crece al escribir varias líneas y no pasa de 180 px', alto3 > caja.alto && alto20 <= 181, JSON.stringify([caja.alto, alto3, alto20]));
  await pagina.fill('#pregunta', '');
  // Respuesta frecuente: texto oficial plegado, fila de acciones y copiar
  await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  const art = await fijar(pagina);
  const f = await art.evaluate((a) => { const d = a.querySelector('details.texto-oficial'); const pie = a.querySelector('.pie-respuesta'); const ac = a.querySelector('.actions').getBoundingClientRect(), op = a.querySelector('.opinion').getBoundingClientRect(); return { cerrado: d && !d.open, resumen: d && d.querySelector('summary').textContent, nota: Boolean(d && d.querySelector('.nota-validez')), visibles: [a.querySelector('.resumen .plain'), a.querySelector('.src')].every((e) => e.checkVisibility()), unaFila: Boolean(pie) && !(ac.bottom <= op.top || ac.top >= op.bottom), aclaracion: a.querySelector('.src + .hint').textContent }; });
  prueba('respuesta frecuente: a la vista la respuesta corta y la fuente; «Ver texto oficial (Artículo 13, Parágrafo segundo)» cerrado, con la nota de validez dentro', f.visibles && f.cerrado && f.resumen === 'Ver texto oficial (Artículo 13, Parágrafo segundo)' && f.nota, JSON.stringify(f));
  prueba('respuesta frecuente: aclaración «… redactada a partir del texto oficial.» (fase 11)', f.aclaracion === 'Borrador para validación. Respuesta frecuente redactada a partir del texto oficial.', f.aclaracion);
  prueba('acciones y opinión en una sola fila a 1280 px (dos grupos dentro de .pie-respuesta)', f.unaFila, JSON.stringify(f));
  await art.locator('details.texto-oficial > summary').focus(); await pagina.keyboard.press('Enter');
  prueba('«Ver texto oficial» se abre con Enter y muestra el texto y la nota de validez', await art.evaluate((a) => a.querySelector('details.texto-oficial').open && a.querySelector('details.texto-oficial .official').checkVisibility() && a.querySelector('details.texto-oficial .nota-validez').checkVisibility()));
  await art.locator('details.texto-oficial > summary').click();
  await art.locator('[data-copy]').click();
  const copiado = await pagina.evaluate(() => window.__copiado || '');
  prueba('copiar: incluye la respuesta corta y el texto oficial aunque esté plegado, y el desplegable vuelve a quedar cerrado', copiado.includes('PARÁGRAFO SEGUNDO') && copiado.includes('60') && !(await art.evaluate((a) => a.querySelector('details.texto-oficial').open)), copiado.slice(0, 80));
  // Pasajes con frases clave: el texto completo va plegado
  for (const q of ['qué pasa en la audiencia de escogencia de vacante', 'cuántas vacantes de docente de preescolar hay en Amazonas']) {
    await pagina.evaluate(() => { document.getElementById('entidad').value = ''; });
    await preguntar(pagina, q);
    const p = await (await fijar(pagina)).evaluate((a) => ({ clave: Boolean(a.querySelector(':scope > .official')), plegado: Boolean(a.querySelector('details.texto-oficial:not([open])')), opec: a.querySelector('details.opec-plegable') ? a.querySelector('details.opec-plegable').open : null }));
    const sinClave = await (await fijar(pagina)).evaluate((a) => { const o = a.querySelector('.official'); return Boolean(o) && o.checkVisibility(); }); // sin frases clave, el texto oficial es la respuesta
    prueba(`pasaje «${q}»: ${p.clave ? 'con frases clave a la vista, el texto completo va plegado' : 'sin frases clave, el texto oficial queda a la vista'}${p.opec !== null ? '; la OPEC va plegada' : ''}`, (p.clave ? p.plegado : sinClave) && p.opec !== true, JSON.stringify(p));
  }
  await contexto.close();
}
{
  // Inicio a 390 × 844: saludo y los cinco temas sin desplazar la página, por encima de la caja fija
  const { contexto, pagina } = await nueva({ viewport: { width: 390, height: 844 } });
  const r = await pagina.evaluate(() => { const form = document.getElementById('form').getBoundingClientRect().top; const t = Array.from(document.querySelectorAll('.tema-tarjeta')).map((e) => e.getBoundingClientRect().bottom); return { form, saludo: document.querySelector('#saludo article').getBoundingClientRect().bottom, temas: t, scroll: window.scrollY }; });
  prueba('celular 390 × 844: al abrir se ven el saludo y los cinco temas por encima de la caja de pregunta, sin desplazar', r.scroll === 0 && r.saludo <= r.form && r.temas.length === 5 && r.temas.every((b) => b <= r.form + 1), JSON.stringify(r));
  await contexto.close();
}

/* 11. Regiones vivas y consola */
{
  const { contexto, pagina, errores } = await nueva();
  await conCinco(pagina);
  await preguntar(pagina, '¿cuántas vacantes hay?');
  const vivas = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]')).map((e) => e.outerHTML.slice(0, 80)));
  prueba('dentro de #log no hay role="status", role="alert" ni aria-live (con la opinión y el saludo)', vivas.length === 0, vivas.join(' / '));
  prueba('sin errores de consola en el diseño nuevo', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

await navegador.close();
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'diseno.json'), JSON.stringify({ resultados }, null, 1));
let fallas = 0;
for (const r of resultados) { if (!r.ok) fallas++; console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${!r.ok && r.detalle ? ' — ' + r.detalle : ''}`); }
console.log(`\nDiseño y presentación: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
process.exit(fallas ? 1 : 0);
