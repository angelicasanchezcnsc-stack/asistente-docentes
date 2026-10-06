// Prueba de la fase 7: tarjetas de temas, buscador de entidad dentro de la respuesta, estructura fija de la respuesta,
// preguntas parecidas y regiones vivas. Playwright + axe-core, Chromium, archivo abierto con file://.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const temas = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'temas.json'), 'utf8'));
const faq = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'faq.json'), 'utf8')).items;
const preguntaDe = new Map(faq.map((f) => [f.id, f.pregunta]));
const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: false, voz: '', velocidad: 'normal' };
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim();
const ANTIOQUIA = 'Secretaría de Educación Departamental de Antioquia';
const BOGOTA = 'Secretaría de Educación Distrital de Bogotá';

const navegador = await chromium.launch();
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

async function nueva({ panel = {}, vista = true, previo = {} } = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
  await contexto.addInitScript(({ panel, vista, previo }) => {
    // Espías: lo que se le pide a la voz y los textos que pasan por #status.
    window.__leido = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { window.__leido.push(u.text); hablar(u); };
    window.__status = [];
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(() => window.__status.push(document.getElementById('status').textContent))
        .observe(document.getElementById('status'), { childList: true, characterData: true, subtree: true });
    });
    if (!sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify(panel));
      if (vista) localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true }));
      for (const [k, v] of Object.entries(previo)) localStorage.setItem(k, JSON.stringify(v));
    }
  }, { panel: { ...PRED, ...panel }, vista, previo });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(url);
  return { contexto, pagina, errores };
}
const axe = async (pagina) => {
  await pagina.evaluate(axeSrc);
  return pagina.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }))
    .violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`));
};
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
const atributos = (pagina) => pagina.evaluate(() => Array.from(document.querySelectorAll('#log article[data-tipo]'))
  .map((a) => [a.dataset.tipo, a.dataset.fuentePrincipal, a.dataset.entidad]));
const activo = (pagina) => pagina.evaluate(() => ({ id: document.activeElement.id, clase: document.activeElement.className, texto: document.activeElement.textContent.trim() }));

/* 1. Temas */
{
  const { contexto, pagina, errores } = await nueva();
  const seccion = pagina.locator('#temas');
  prueba('la sección de temas está desplegada al cargar, con su título', (await seccion.isVisible()) && (await pagina.locator('#temas-titulo').textContent()) === '¿Sobre qué quiere saber?' && (await pagina.getAttribute('#temas-alternar', 'aria-expanded')) === 'true' && (await pagina.textContent('#temas-alternar')) === 'Ocultar los temas');
  const tarjetas = await pagina.locator('.tema-tarjeta').evaluateAll((els) => els.map((e) => [e.querySelector('.tema-titulo').textContent, e.querySelector('.tema-cuenta').textContent]));
  const esperadas = temas.map((t) => [t.titulo, t.faq.length === 1 ? '1 pregunta' : `${t.faq.length} preguntas`]);
  prueba('una tarjeta por tema, con su título y su cuenta de preguntas (leídos de temas.json)', JSON.stringify(tarjetas) === JSON.stringify(esperadas), JSON.stringify(tarjetas));
  prueba('ya no existe la lista de preguntas del panel lateral', (await pagina.locator('#sugeridas, #sugTitle').count()) === 0);
  prueba('toda pregunta frecuente está en algún tema y todo tema cita preguntas que existen', faq.every((f) => temas.some((t) => t.faq.includes(f.id))) && temas.every((t) => t.faq.every((id) => preguntaDe.has(id))));
  prueba('cada tarjeta es un botón de al menos 44 px de alto', (await pagina.locator('.tema-tarjeta').evaluateAll((els) => els.every((e) => e.tagName === 'BUTTON' && e.getBoundingClientRect().height >= 44))));
  for (const t of temas) {
    await pagina.click(`.tema-tarjeta[data-tema="${t.id}"]`);
    const preguntas = await pagina.locator('#temas-lista-preguntas .tema-pregunta').allTextContents();
    prueba(`tema «${t.titulo}»: lista exactamente sus preguntas, en orden`, JSON.stringify(preguntas) === JSON.stringify(t.faq.map((id) => preguntaDe.get(id))) && (await pagina.textContent('#temas-subtitulo')) === t.titulo, JSON.stringify(preguntas));
    prueba(`tema «${t.titulo}»: el foco queda en el subtítulo`, (await activo(pagina)).id === 'temas-subtitulo');
    await pagina.click('#temas-volver');
    prueba(`tema «${t.titulo}»: «Volver a los temas» devuelve el foco a la tarjeta`, (await pagina.locator('#temas-lista').isVisible()) && (await pagina.evaluate(() => document.activeElement.dataset.tema)) === t.id);
    await pagina.click(`.tema-tarjeta[data-tema="${t.id}"]`);
    await pagina.keyboard.press('Escape');
    prueba(`tema «${t.titulo}»: Escape equivale a «Volver a los temas»`, (await pagina.locator('#temas-lista').isVisible()) && (await pagina.evaluate(() => document.activeElement.dataset.tema)) === t.id);
  }
  prueba('sin errores de consola (temas)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

/* 2. Temas con solo teclado, plegado y despliegue */
{
  const { contexto, pagina } = await nueva();
  await pagina.locator('.tema-tarjeta[data-tema="pruebas"]').focus();
  await pagina.keyboard.press('Enter');
  let llegada = false;
  for (let i = 0; i < 8 && !llegada; i++) { await pagina.keyboard.press('Tab'); llegada = (await activo(pagina)).texto === '¿Cuánto vale la entrevista?'; }
  prueba('con Tab se llega a «¿Cuánto vale la entrevista?» dentro del tema', llegada);
  await pagina.keyboard.press('Enter');
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 1);
  const [tipo, principal] = (await atributos(pagina))[0];
  prueba('la respuesta es la pregunta frecuente con fuente principal «Numeral 6.1»', tipo === 'faq' && principal === 'Numeral 6.1', `${tipo} ${principal}`);
  prueba('la sección de temas se pliega, con aria-expanded="false" y el botón «Ver los temas»', (await pagina.locator('#temas-cuerpo').isHidden()) && (await pagina.getAttribute('#temas-alternar', 'aria-expanded')) === 'false' && (await pagina.textContent('#temas-alternar')) === 'Ver los temas');
  prueba('el foco queda en la caja de pregunta', (await activo(pagina)).id === 'pregunta');
  await pagina.click('#temas-alternar');
  prueba('«Ver los temas» la despliega con las tarjetas', (await pagina.locator('.tema-tarjeta').first().isVisible()) && (await pagina.textContent('#temas-alternar')) === 'Ocultar los temas' && (await pagina.getAttribute('#temas-alternar', 'aria-expanded')) === 'true');
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva();
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar');
  prueba('escribir y enviar una pregunta también pliega los temas', await pagina.locator('#temas-cuerpo').isHidden());
  await contexto.close();
}
{
  // Cada pregunta de cada tema, al elegirla, da una respuesta frecuente (la de vacantes, sin entidad, «Depende de su entidad»)
  const { contexto, pagina } = await nueva();
  const fallas = [];
  for (const t of temas) for (const id of t.faq) {
    if (await pagina.locator('#temas-cuerpo').isHidden()) await pagina.click('#temas-alternar');
    await pagina.click(`.tema-tarjeta[data-tema="${t.id}"]`);
    const antes = await nRespuestas(pagina);
    await pagina.locator('.tema-pregunta', { hasText: preguntaDe.get(id) }).first().click();
    await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
    const tipo = await ultima(pagina).getAttribute('data-tipo');
    const esperado = id === 'vacantes-entidad' ? 'depende-entidad' : 'faq';
    if (tipo !== esperado) fallas.push(`${t.id}/${id}: ${tipo}`);
  }
  prueba('cada pregunta de cada tema da su respuesta (faq, o depende-entidad en vacantes sin entidad)', fallas.length === 0, fallas.join('; '));
  await contexto.close();
}

/* 3. Buscador de entidad */
async function conBuscador(pagina, pregunta) { await preguntar(pagina, pregunta); return (await fijar(pagina)).locator('input[role="combobox"]'); }
{
  const { contexto, pagina, errores } = await nueva({ panel: { botonesEscuchar: true } });
  const entradas = await pagina.locator('#entidad option').evaluateAll((os) => os.map((o) => o.value).filter(Boolean));
  const buscador = await conBuscador(pagina, '¿cuántas vacantes hay?');
  const art = await fijar(pagina);
  prueba('«Depende de su entidad» trae el buscador (rama de la búsqueda por entidad)', (await art.getAttribute('data-tipo')) === 'depende-entidad' && (await buscador.count()) === 1);
  prueba('la instrucción reemplaza la que mandaba al panel lateral', (await art.innerText()).includes('Escriba el nombre de su entidad y elíjala de la lista: el asistente volverá a responder con el texto de su acuerdo.') && !(await art.innerText()).includes('panel «Antes de preguntar»'));
  prueba('nombre accesible «Nombre de su entidad» y atributos del combobox', (await pagina.evaluate(() => { const i = document.querySelector('#log input[role="combobox"]'); return document.querySelector(`label[for="${i.id}"]`).textContent; })) === 'Nombre de su entidad'
    && (await buscador.getAttribute('aria-expanded')) === 'false' && (await buscador.getAttribute('aria-autocomplete')) === 'list' && Boolean(await buscador.getAttribute('aria-controls')));
  const opciones = () => art.locator('[role="option"]').allTextContents();
  const estadoLocal = () => art.locator('.buscador-entidad .hint').textContent();
  // Búsquedas
  const casos = [
    ['E3 palabras en otro orden', 'antioquia departamental', [ANTIOQUIA]],
    ['E4 mayúsculas y tilde', 'BOGOTÁ', [BOGOTA]],
    ['E5 Cali', 'cali', ['Secretaría de Educación Distrital de Santiago de Cali']],
    ['E1 antio', 'antio', [ANTIOQUIA]]
  ];
  for (const [nombre, texto, esperado] of casos) {
    await buscador.fill(texto);
    const o = await opciones();
    prueba(`${nombre}: «${texto}»`, JSON.stringify(o) === JSON.stringify(esperado), JSON.stringify(o));
  }
  prueba('con opciones, aria-expanded="true" y el aviso del buscador', (await buscador.getAttribute('aria-expanded')) === 'true' && (await estadoLocal()) === 'Una entidad encontrada.');
  prueba('el aviso también va a #status de la página', (await pagina.textContent('#status')) === 'Una entidad encontrada.');
  await buscador.fill('secretaria');
  const todas = entradas.filter((e) => norm(e).includes('secretaria')).length;
  prueba('E6 «secretaria»: 8 opciones y el aviso de «más entidades»', (await opciones()).length === 8 && (await estadoLocal()) === `${todas} entidades encontradas. Hay más entidades: siga escribiendo para acotar.` && (await pagina.textContent('#status')) === (await estadoLocal()), `${(await opciones()).length}; ${await estadoLocal()}`);
  await buscador.fill('zzzz');
  prueba('E7 «zzzz»: sin lista y aviso de sin resultados', (await opciones()).length === 0 && (await art.locator('[role="listbox"]').isHidden()) && (await buscador.getAttribute('aria-expanded')) === 'false' && (await estadoLocal()) === 'Sin resultados. Revise la ortografía o escriba otra parte del nombre.');
  await buscador.fill('a');
  prueba('E8 «a»: sin lista y aviso vacío (menos de 2 caracteres)', (await opciones()).length === 0 && (await estadoLocal()) === '');
  // Teclado
  await buscador.fill('secretaria');
  await buscador.press('ArrowDown');
  const primera = await art.locator('[role="option"]').first().getAttribute('id');
  prueba('flecha abajo activa la primera opción (aria-activedescendant y aria-selected)', (await buscador.getAttribute('aria-activedescendant')) === primera && (await art.locator('[role="option"]').first().getAttribute('aria-selected')) === 'true');
  await buscador.press('ArrowUp');
  const ultimaOp = await art.locator('[role="option"]').last().getAttribute('id');
  prueba('flecha arriba da la vuelta a la última opción', (await buscador.getAttribute('aria-activedescendant')) === ultimaOp);
  await buscador.press('Escape');
  prueba('Escape cierra la lista y deja el texto', (await buscador.getAttribute('aria-expanded')) === 'false' && (await buscador.inputValue()) === 'secretaria');
  await buscador.fill('antio'); await buscador.press('Tab');
  prueba('Tab cierra la lista y sigue el orden normal', (await buscador.getAttribute('aria-expanded')) === 'false' && (await activo(pagina)).id !== (await buscador.getAttribute('id')));
  await buscador.fill('antio');
  const alturas = await art.locator('[role="option"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  prueba('las opciones miden al menos 44 px de alto', alturas.length > 0 && alturas.every((h) => h >= 44), JSON.stringify(alturas));
  // axe con la lista abierta
  prueba('axe con la lista de opciones abierta', (await axe(pagina)).length === 0);
  // La lectura en voz alta no recorre el buscador
  await pagina.evaluate(() => { window.__leido = []; });
  await art.locator('[data-speak]').click();
  await pagina.waitForTimeout(600);
  const leido = await pagina.evaluate(() => window.__leido.join(' '));
  prueba('la lectura en voz alta incluye la instrucción pero no el buscador ni sus opciones', leido.includes('Escriba el nombre de su entidad y elíjala de la lista') && !leido.includes('Nombre de su entidad') && !leido.includes('Una entidad encontrada') && !leido.includes(ANTIOQUIA), leido.slice(0, 160));
  await pagina.evaluate(() => speechSynthesis.cancel());
  // E1: elegir con Enter
  await buscador.fill('antio');
  await buscador.press('ArrowDown'); await buscador.press('Enter');
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 2);
  const mensajes = await pagina.locator('#log .msg.user').allTextContents();
  const attrs = await atributos(pagina);
  prueba('E1 al elegir con Enter: la pregunta se repite y la respuesta nueva es faq, «Artículo 8», entidad Antioquia', mensajes.length === 2 && mensajes[0] === mensajes[1] && JSON.stringify(attrs[1]) === JSON.stringify(['faq', 'Artículo 8', ANTIOQUIA]), JSON.stringify(attrs));
  prueba('el buscador se reemplaza por «Entidad elegida: …»', (await art.locator('input[role="combobox"]').count()) === 0 && (await art.locator('.plain', { hasText: `Entidad elegida: ${ANTIOQUIA}.` }).count()) === 1);
  prueba('el selector del panel lateral toma la entidad', (await pagina.inputValue('#entidad')) === ANTIOQUIA);
  const estados = await pagina.evaluate(() => window.__status);
  prueba('#status anuncia «Entidad elegida: …» y después «Respuesta lista.»', estados.includes(`Entidad elegida: ${ANTIOQUIA}.`) && estados.at(-1) === 'Respuesta lista.', JSON.stringify(estados.slice(-4)));
  prueba('el foco queda en la caja de pregunta', (await activo(pagina)).id === 'pregunta');
  // Regiones vivas dentro de #log
  const vivas = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]')).map((e) => e.outerHTML.slice(0, 80)));
  prueba('dentro de #log no hay role="status", role="alert" ni aria-live (con el buscador ya usado y la bienvenida)', vivas.length === 0, vivas.join(' / '));
  prueba('sin errores de consola (buscador)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}
{
  // E2: la otra rama (pregunta frecuente con requiereEntidad) y elección con clic
  const { contexto, pagina } = await nueva();
  const buscador = await conBuscador(pagina, '¿cuántas vacantes ofrece mi entidad?');
  const art = await fijar(pagina);
  prueba('la pregunta frecuente de vacantes sin entidad también trae el buscador', (await art.getAttribute('data-tipo')) === 'depende-entidad' && (await buscador.count()) === 1);
  const vivasAntes = await pagina.evaluate(() => document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]').length);
  await buscador.fill('bogota');
  const hint = await art.locator('.buscador-entidad .hint').evaluate((e) => ({ role: e.getAttribute('role'), live: e.getAttribute('aria-live') }));
  prueba('el aviso del buscador no lleva role ni aria-live', hint.role === null && hint.live === null, JSON.stringify(hint));
  prueba('E2 «bogota»: una opción', JSON.stringify(await art.locator('[role="option"]').allTextContents()) === JSON.stringify([BOGOTA]));
  await art.locator('[role="option"]').first().click();
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 2);
  const attrs = await atributos(pagina);
  prueba('E2 al elegir con clic: faq, «Artículo 8», entidad Bogotá', JSON.stringify(attrs[1]) === JSON.stringify(['faq', 'Artículo 8', BOGOTA]), JSON.stringify(attrs));
  prueba('sin regiones vivas en #log (rama de pregunta frecuente)', vivasAntes === 0 && (await pagina.evaluate(() => document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]').length)) === 0);
  // Cambio de perfil: la conversación se conserva idéntica
  const antes = await atributos(pagina);
  await pagina.click('#btn-perfil');
  await pagina.check('#bv-p-fisico');
  await Promise.all([pagina.waitForNavigation(), pagina.click('#bv-guardar')]);
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 2);
  prueba('tras cambiar de perfil las dos preguntas y las dos respuestas son idénticas', JSON.stringify(await atributos(pagina)) === JSON.stringify(antes) && (await pagina.locator('#log .msg.user').count()) === 2, JSON.stringify(await atributos(pagina)));
  prueba('tras el cambio de perfil la sección de temas nace plegada', (await pagina.locator('#temas-cuerpo').isHidden()) && (await pagina.getAttribute('#temas-alternar', 'aria-expanded')) === 'false');
  await contexto.close();
}
{
  // Con entidad conocida no hay buscador
  const { contexto, pagina } = await nueva();
  await preguntar(pagina, 'cuantas vacantes ofrece Antioquia');
  prueba('si la entidad ya se conoce, la respuesta no trae buscador', (await ultima(pagina).locator('input[role="combobox"]').count()) === 0 && (await ultima(pagina).getAttribute('data-tipo')) === 'faq');
  await contexto.close();
}

/* 4. Estructura fija de la respuesta */
{
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true } });
  const casos = [
    ['pregunta frecuente (caso 1)', '¿cuál es el puntaje mínimo para aprobar?'],
    ['pregunta frecuente con dos fuentes (caso 5)', 'me puedo inscribir a dos empleos'],
    ['pasaje (caso 7)', 'qué pasa en la audiencia de escogencia de vacante']
  ];
  for (const [nombre, q] of casos) {
    await preguntar(pagina, q);
    const r = await ultima(pagina).evaluate((a) => {
      const pos = (x, y) => (x && y ? Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING) : false);
      const h3s = Array.from(a.querySelectorAll('h3'));
      const corto = (() => { const t = h3s.find((h) => /^(En pocas palabras|Lo más relevante)/.test(h.textContent)); return t ? t.nextElementSibling : null; })();
      const src = a.querySelector('.src');
      const oficial = h3s.find((h) => h.textContent === 'Texto oficial');
      const nota = a.querySelector('.nota-validez');
      const rel = a.querySelector('details.relacionadas');
      const borradores = Array.from(a.querySelectorAll('.src')).filter((b) => b.getClientRects().length > 0 && !b.closest('details:not([open])') && /· Borrador/.test(b.textContent)).length;
      return { orden: pos(corto, src) && pos(src, oficial) && pos(oficial, nota) && (!rel || pos(nota, rel)), borradores, h3Vacios: h3s.filter((h) => h.textContent.trim() === '').length, hayCorto: Boolean(corto) };
    });
    prueba(`${nombre}: respuesta corta, fuente, «Texto oficial», nota de validez y relacionadas, en ese orden`, r.orden && r.hayCorto, JSON.stringify(r));
    prueba(`${nombre}: una sola fuente visible con «· Borrador»`, r.borradores === 1, String(r.borradores));
    prueba(`${nombre}: ningún encabezado vacío`, r.h3Vacios === 0);
  }
  await preguntar(pagina, 'cuantas vacantes ofrece Antioquia');
  // Mayúsculas, tamaño base y longitud de línea
  const m = await pagina.evaluate(() => {
    const visibles = Array.from(document.querySelectorAll('body *')).filter((e) => e.getClientRects().length > 0 && !e.closest('.sr-only'));
    const mayus = visibles.filter((e) => getComputedStyle(e).textTransform !== 'none').map((e) => e.tagName.toLowerCase() + '.' + e.className);
    const chicos = visibles.filter((e) => Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 13.5).map((e) => `${e.tagName.toLowerCase()}.${e.className} ${getComputedStyle(e).fontSize}`);
    const plain = document.querySelector('#log .msg.bot .plain');
    const sonda = document.createElement('div'); sonda.style.cssText = 'width:70ch;position:absolute;visibility:hidden'; plain.appendChild(sonda);
    const setenta = sonda.getBoundingClientRect().width; sonda.remove();
    return { mayus: [...new Set(mayus)], chicos: [...new Set(chicos)], base: getComputedStyle(document.documentElement).fontSize, maxAncho: getComputedStyle(plain).maxWidth, setenta };
  });
  prueba('ningún elemento visible usa text-transform distinto de none (sin mayúsculas sostenidas)', m.mayus.length === 0, m.mayus.join(', '));
  prueba('el tamaño base es de 18 px con el panel en 100 %', m.base === '18px', m.base);
  prueba('ningún texto visible mide menos de 0,75 rem (13,5 px)', m.chicos.length === 0, m.chicos.join(', '));
  prueba('las líneas de respuesta tienen un máximo de 70 caracteres (70ch)', Math.abs(parseFloat(m.maxAncho) - m.setenta) < 1, `${m.maxAncho} frente a ${m.setenta}`);
  await pagina.click('#btn-accesibilidad');
  await pagina.waitForSelector('.a11y-panel--abierto');
  prueba('el panel sigue mostrando «100 %» como tamaño normal', (await pagina.textContent('.a11y-tamano__valor')).trim() === '100 %');
  await contexto.close();
}
{
  const { contexto, pagina } = await nueva({ panel: { texto: 200 } });
  prueba('con el panel en 200 %, el tamaño base pasa a 36 px', (await pagina.evaluate(() => getComputedStyle(document.documentElement).fontSize)) === '36px');
  await contexto.close();
}
{
  // La bienvenida (diálogo) tampoco usa mayúsculas sostenidas ni textos menores de 0,75 rem
  const { contexto, pagina } = await nueva({ vista: false });
  const r = await pagina.evaluate(() => {
    const vis = Array.from(document.querySelectorAll('dialog[open] *')).filter((e) => e.getClientRects().length > 0 && !e.closest('.sr-only'));
    return { mayus: vis.filter((e) => getComputedStyle(e).textTransform !== 'none').length, chicos: vis.filter((e) => Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 13.5).length };
  });
  prueba('el diálogo de bienvenida no usa mayúsculas sostenidas ni textos menores de 13,5 px', r.mayus === 0 && r.chicos === 0, JSON.stringify(r));
  await contexto.close();
}

/* 5. Preguntas parecidas */
{
  const { contexto, pagina } = await nueva();
  const P = (a) => a.map((id) => preguntaDe.get(id));
  const casos = [
    ['P1', 'cuánto dura la entrevista', P(['entrevista'])],
    ['P2', 'cuándo salen los resultados', P(['reclamacion-escritas', 'reclamacion-vrm'])],
    ['P3', 'cuánto tarda el proceso', P(['etapas'])],
    ['P4', 'qué pasa si no apruebo', []],
    ['P5', 'dónde reclamo si no estoy de acuerdo', []],
    ['P6', 'quién gana el mundial de fútbol', []]
  ];
  for (const [id, q, esperado] of casos) {
    await preguntar(pagina, q);
    const art = ultima(pagina);
    const sugeridas = await art.locator('.pregunta-parecida').allTextContents();
    prueba(`${id} «${q}»: no-encontrado con ${esperado.length ? 'preguntas parecidas' : 'ninguna sugerencia'}`, (await art.getAttribute('data-tipo')) === 'no-encontrado' && JSON.stringify(sugeridas) === JSON.stringify(esperado) && ((esperado.length > 0) === ((await art.locator('h3', { hasText: 'Preguntas parecidas' }).count()) === 1)), JSON.stringify(sugeridas));
  }
  await preguntar(pagina, 'cuánto dura la entrevista');
  const antes = await nRespuestas(pagina);
  await ultima(pagina).locator('.pregunta-parecida').first().click();
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
  const [tipo, principal] = (await atributos(pagina)).at(-1);
  prueba('P1 al activar la sugerencia se obtiene su respuesta frecuente (Numeral 6.1)', tipo === 'faq' && principal === 'Numeral 6.1', `${tipo} ${principal}`);
  prueba('P1 la sugerencia queda en la bitácora de preguntas (historial) como una pregunta más', (await pagina.locator('#log .msg.user').last().textContent()).includes('¿Cuánto vale la entrevista?'));
  await contexto.close();
}

/* 6. Regiones vivas, con una conversación variada */
{
  const { contexto, pagina } = await nueva();
  for (const q of ['cuál es el puntaje mínimo para aprobar', '¿cuántas vacantes hay?', 'cuánto dura la entrevista', 'cuánto cuesta la inscripción', '¿qué es la OPEC?']) await preguntar(pagina, q);
  const vivas = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log [role="status"], #log [role="alert"], #log [aria-live]')).map((e) => e.outerHTML.slice(0, 80)));
  prueba('dentro de #log no hay role="status", role="alert" ni aria-live (con respuestas de todos los tipos)', vivas.length === 0, vivas.join(' / '));
  prueba('#log sigue siendo la región viva de la conversación', (await pagina.getAttribute('#log', 'role')) === 'log' && (await pagina.getAttribute('#log', 'aria-live')) === 'polite');
  prueba('la sección de temas está fuera de #log', (await pagina.locator('#log #temas').count()) === 0);
  await contexto.close();
}

await navegador.close();
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'navegacion.json'), JSON.stringify({ resultados }, null, 1));
let fallas = 0;
for (const r of resultados) { if (!r.ok) fallas++; console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${!r.ok && r.detalle ? ' — ' + r.detalle : ''}`); }
console.log(`\nNavegación guiada y estructura de respuesta: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
process.exit(fallas ? 1 : 0);
