// Prueba de la fase 13: mensajes sociales, «No encontrado» con un siguiente paso, preguntas de seguimiento y frase de enlace.
// Primero en Node (conversacion.js y decision.js, sin navegador) y luego en Chromium con file:// y axe-core.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { SYN } from '../src/js/motor-busqueda.js';
import { crearBase } from '../src/js/base-conocimiento.js';
import { crearReservados } from '../src/js/reservados.js';
import { crearDecisor } from '../src/js/decision.js';
import { clasificarSocial, quitarSaludo, resolverSeguimiento } from '../src/js/conversacion.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const leer = (...p) => JSON.parse(readFileSync(path.join(raiz, ...p), 'utf8'));
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const temas = leer('herramientas', 'temas.json');
const preguntaDe = new Map(leer('herramientas', 'faq.json').items.map((f) => [f.id, f.pregunta]));
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });
const ANTIOQUIA = 'Secretaría de Educación Departamental de Antioquia';
const CALI = 'Secretaría de Educación Distrital de Santiago de Cali';

/* 1. En Node: casos C1 a C16 (plan, sección 7) */
Object.assign(SYN, leer('herramientas', 'sinonimos_ciudadania.json'));
const reservados = crearReservados(leer('herramientas', 'temas_reservados.json'));
const base = crearBase(leer('herramientas', 'kb.json'), leer('herramientas', 'faq.json').items, reservados);
const decidir = crearDecisor(base, reservados);
const sociales = [['C1', 'hola', 'saludo'], ['C2', 'Buenos días', 'saludo'], ['C3', 'hola buenas tardes señor', 'saludo'], ['C4', 'gracias', 'gracias'],
  ['C5', 'ok, muchas gracias', 'gracias'], ['C6', 'chao', 'despedida'], ['C7', 'gracias, hasta luego', 'despedida'], ['C8', '¿quién eres?', 'quien'],
  ['C9', 'hola, ¿quién eres?', 'quien'], ['C10', 'no entiendo', 'ayuda'], ['C11', '?', 'ayuda']];
for (const [id, q, cat] of sociales) {
  const d = decidir(q);
  prueba(`${id} «${q}» es un mensaje social (${cat})`, clasificarSocial(q) === cat && d.tipo === 'conversacion' && d.categoria === cat, `${clasificarSocial(q)} / ${d.tipo}`);
}
prueba('C12 «hola, ¿cuántas vacantes hay?» no es social y se responde sin el saludo', clasificarSocial('hola, ¿cuántas vacantes hay?') === null
  && quitarSaludo('hola, ¿cuántas vacantes hay?') === 'cuantas vacantes hay' && decidir('hola, ¿cuántas vacantes hay?').tipo === 'depende-entidad');
prueba('C13 «¿para qué sirve la OPEC?» no es social', clasificarSocial('¿para qué sirve la OPEC?') === null);
for (const q of ['cuánto vale la entrevista', '¿cómo está la convocatoria?', 'me puedo inscribir a dos empleos', 'quién gana el mundial de fútbol'])
  prueba(`«${q}» no es social y no pierde palabras`, clasificarSocial(q) === null && quitarSaludo(q) === q);
const s14 = resolverSeguimiento('¿y en Antioquia?', '¿cuántas vacantes hay?', base);
prueba('C14 «¿y en Antioquia?» es seguimiento de la pregunta anterior', s14 && s14.pregunta === '¿cuántas vacantes hay?' && s14.entidad === ANTIOQUIA, JSON.stringify(s14));
const s15 = resolverSeguimiento('y para Cali', '¿cuántas vacantes hay?', base);
prueba('C15 «y para Cali» es seguimiento con Santiago de Cali', s15 && s15.entidad === CALI, JSON.stringify(s15));
prueba('C16 una pregunta completa con entidad no es seguimiento', resolverSeguimiento('cuantas vacantes ofrece Antioquia', '¿cuántas vacantes hay?', base) === null);
prueba('sin pregunta anterior no hay seguimiento', resolverSeguimiento('¿y en Antioquia?', null, base) === null);

/* 2. En el navegador */
const navegador = await chromium.launch();
async function nueva() {
  const contexto = await navegador.newContext({ viewport: { width: 1100, height: 900 } });
  await contexto.addInitScript(() => { try { localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true })); } catch (e) {} });
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
  return pagina.locator('#log article[data-tipo]').nth(antes);
}
const datos = (a) => a.evaluate((el) => ({ tipo: el.dataset.tipo, categoria: el.dataset.categoria || '', principal: el.dataset.fuentePrincipal, entidad: el.dataset.entidad }));
const bitacora = (pagina) => pagina.evaluate(() => Object.keys(localStorage).filter((k) => /bitacora/.test(k)).flatMap((k) => JSON.parse(localStorage.getItem(k) || '[]')));
const axe = async (pagina) => {
  await pagina.evaluate(axeSrc);
  return pagina.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }))
    .violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`));
};

// Mensajes sociales
{
  const { contexto, pagina, errores } = await nueva();
  const hola = await preguntar(pagina, 'hola');
  const d = await datos(hola);
  prueba('«hola» da una respuesta de conversación (saludo)', d.tipo === 'conversacion' && d.categoria === 'saludo', JSON.stringify(d));
  prueba('saludo: texto aprobado', (await hola.locator('p.plain').first().textContent()) === 'Hola. Elija un tema o escriba su pregunta sobre el proceso de selección.');
  const botones = await hola.locator('.tema-respuesta').allTextContents();
  prueba('saludo: los temas como botones, en el orden de temas.json', JSON.stringify(botones) === JSON.stringify(temas.map((t) => t.titulo)), botones.join(' / '));
  prueba('saludo: la lista de temas se llama «Temas»', (await hola.locator('ul.temas-respuesta').getAttribute('aria-label')) === 'Temas');
  prueba('saludo: sin «¿Le sirvió esta respuesta?» ni Copiar o Imprimir', (await hola.locator('.opinion, [data-copy], [data-print]').count()) === 0);
  const gracias = await preguntar(pagina, 'gracias');
  prueba('«gracias»: texto aprobado', (await gracias.innerText()).includes('Con gusto. Si tiene otra pregunta, escríbala aquí.'));
  const chao = await preguntar(pagina, 'chao');
  prueba('«chao»: texto aprobado', (await chao.innerText()).includes('Hasta pronto. Recuerde que rige el texto que publique la CNSC.'));
  const quien = await preguntar(pagina, '¿quién eres?');
  prueba('«¿quién eres?»: los cuatro párrafos del saludo, el primero en negrita', (await quien.locator('p:not(.sin-voz)').count()) === 4
    && (await quien.locator('p strong').textContent()) === 'Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.');
  const ayuda = await preguntar(pagina, 'no entiendo');
  prueba('«no entiendo»: párrafo aprobado y temas', (await ayuda.innerText()).includes('Puede elegir un tema o escribir su pregunta. Si la respuesta depende de su entidad, se la pediré en ese momento.')
    && (await ayuda.locator('.tema-respuesta').count()) === temas.length);
  prueba('los mensajes sociales no quedan en la bitácora', (await bitacora(pagina)).length === 0);
  prueba('axe sin violaciones con las respuestas sociales', (await axe(pagina)).length === 0, (await axe(pagina)).join(' | '));
  prueba('sin errores de consola (sociales)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

// «No encontrado» con un siguiente paso
{
  const { contexto, pagina, errores } = await nueva();
  const mundial = await preguntar(pagina, 'quién gana el mundial de fútbol');
  prueba('«No encontrado»: primer párrafo nuevo', (await mundial.locator('p.plain').first().textContent()) === 'No encontré esa respuesta en los documentos del proceso.');
  prueba('«No encontrado» sin preguntas parecidas: muestra los temas con el encabezado «Temas»', (await mundial.locator('h3:text-is("Temas")').count()) === 1 && (await mundial.locator('.tema-respuesta').count()) === temas.length);
  prueba('«No encontrado» queda en la bitácora', (await bitacora(pagina)).length === 1);
  const entrevista = await preguntar(pagina, 'cuánto dura la entrevista');
  prueba('«No encontrado» con preguntas parecidas: no repite los temas', (await entrevista.locator('.pregunta-parecida').count()) === 1 && (await entrevista.locator('.tema-respuesta').count()) === 0);
  const horario = await preguntar(pagina, '¿cuál es el horario de atención de la CNSC en Bogotá?');
  const texto = await horario.innerText();
  prueba('caso 6: pregunta de aclaración «¿Se refiere al…?» en lugar del texto más cercano', /¿Se refiere al (Numeral|Artículo) [^?]+\?/.test(texto) && !texto.includes('Texto más cercano'), texto.slice(-200));
  const ver = horario.locator('.ver-cercano');
  const rotulo = ((await ver.textContent()).match(/^Ver texto oficial \((.+)\)$/) || [])[1];
  const antes = await nRespuestas(pagina);
  await ver.click();
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
  const d = await datos(pagina.locator('#log article[data-tipo]').last());
  prueba('«Ver texto oficial» agrega un pasaje con ese rótulo', d.tipo === 'pasaje' && d.principal === rotulo, `${JSON.stringify(d)} / ${rotulo}`);
  prueba('axe sin violaciones con «No encontrado»', (await axe(pagina)).length === 0, (await axe(pagina)).join(' | '));
  prueba('sin errores de consola («No encontrado»)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

// Preguntas de seguimiento y frase de enlace
{
  const { contexto, pagina, errores } = await nueva();
  await preguntar(pagina, '¿cuántas vacantes hay?');
  await preguntar(pagina, 'hola');
  const ant = await preguntar(pagina, '¿y en Antioquia?');
  const d = await datos(ant);
  prueba('C14 en el navegador: «¿y en Antioquia?» (después de un saludo) responde la pregunta anterior con Antioquia', d.tipo === 'faq' && d.principal === 'Artículo 8' && d.entidad === ANTIOQUIA, JSON.stringify(d));
  prueba('C14: la conversación muestra lo que la persona escribió', (await pagina.locator('#log .msg.user').last().textContent()).includes('¿y en Antioquia?'));
  prueba('C14: el selector de entidad queda en Antioquia', (await pagina.inputValue('#entidad')) === ANTIOQUIA);
  const cali = await datos(await preguntar(pagina, 'y para Cali'));
  prueba('C15 en el navegador: «y para Cali»', cali.tipo === 'faq' && cali.entidad === CALI, JSON.stringify(cali));
  const audiencia = await preguntar(pagina, 'qué pasa en la audiencia de escogencia de vacante');
  prueba('caso 7: frase de enlace antes del texto oficial', (await audiencia.locator('p.enlace').textContent()) === 'Esto dice el Numeral 7.3 del Proyecto de Anexo Técnico Docentes 2026:');
  const puntaje = await preguntar(pagina, '¿cuál es el puntaje mínimo para aprobar?');
  prueba('las preguntas frecuentes no llevan frase de enlace', (await puntaje.locator('p.enlace').count()) === 0);
  prueba('sin errores de consola (seguimiento)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}
// Fase 14: un tema elegido dentro de una respuesta se responde en la conversación
{
  const { contexto, pagina, errores } = await nueva();
  const hola = await preguntar(pagina, 'hola');
  const t = temas[1];
  const antes = await nRespuestas(pagina);
  await hola.locator(`.tema-respuesta[data-tema="${t.id}"]`).click();
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length > n, antes);
  const burbuja = pagina.locator('#log article[data-tipo]').last();
  const d = await burbuja.evaluate((a) => ({ tipo: a.dataset.tipo, tema: a.dataset.tema }));
  prueba('fase 14: el tema se responde con una burbuja nueva al final de la conversación (tipo «tema»)', d.tipo === 'tema' && d.tema === t.id, JSON.stringify(d));
  prueba('fase 14: antes, una burbuja de la persona con el título del tema', (await pagina.locator('#log .msg.user').last().textContent()).includes(t.titulo));
  const preguntas = await burbuja.locator('.tema-pregunta-respuesta').allTextContents();
  prueba('fase 14: las preguntas del tema, en el orden de temas.json', JSON.stringify(preguntas) === JSON.stringify(t.faq.map((id) => preguntaDe.get(id))), preguntas.join(' / '));
  const foco = await pagina.evaluate(() => ({ clase: document.activeElement.className, texto: document.activeElement.textContent, oculto: document.getElementById('temas-cuerpo').hidden }));
  prueba('fase 14: el foco va al encabezado de la burbuja y la sección de temas de arriba no se despliega', foco.clase === 'tema-encabezado' && foco.texto === t.titulo && foco.oculto, JSON.stringify(foco));
  prueba('fase 14: sin opinión ni Copiar o Imprimir', (await burbuja.locator('.opinion, [data-copy], [data-print]').count()) === 0);
  prueba('fase 14: no queda en la bitácora', (await bitacora(pagina)).length === 0);
  const estilo = await pagina.evaluate(() => { const a = getComputedStyle(document.querySelector('#log .tema-respuesta')), b = getComputedStyle(document.querySelector('#log .tema-pregunta-respuesta')); return { a: [a.fontWeight, parseFloat(a.borderTopLeftRadius) >= 22], b: [b.fontWeight, parseFloat(b.borderTopLeftRadius) >= 22] }; });
  prueba('fase 14: temas y preguntas de la conversación son botones redondeados sin negrita', estilo.a[0] === '400' && estilo.a[1] && estilo.b[0] === '400' && estilo.b[1], JSON.stringify(estilo));
  prueba('axe sin violaciones con la burbuja del tema', (await axe(pagina)).length === 0, (await axe(pagina)).join(' | '));
  const n = await nRespuestas(pagina);
  await burbuja.locator('.tema-pregunta-respuesta').first().click();
  await pagina.waitForFunction((k) => document.querySelectorAll('#log article[data-tipo]').length > k, n);
  const r = await pagina.locator('#log article[data-tipo]').last().evaluate((a) => a.dataset.tipo);
  prueba('fase 14: la pregunta elegida se envía y se responde abajo', r === 'faq' || r === 'depende-entidad', r);
  const conversacion = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#log article[data-tipo]')).map((a) => [a.dataset.tipo, a.dataset.tema || a.dataset.categoria || a.dataset.fuentePrincipal]));
  const previa = await conversacion();
  await pagina.click('#btn-mas'); await pagina.click('#btn-perfil');
  await pagina.check('#bv-p-fisico');
  await Promise.all([pagina.waitForNavigation(), pagina.click('#bv-guardar')]);
  await pagina.waitForFunction((k) => document.querySelectorAll('#log article[data-tipo]').length >= k, previa.length);
  prueba('fase 14: el cambio de perfil conserva la burbuja del tema', JSON.stringify(await conversacion()) === JSON.stringify(previa), JSON.stringify(await conversacion()));
  prueba('sin errores de consola (tema)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}
await navegador.close();

mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'conversacion.json'), JSON.stringify({ resultados }, null, 1));
let fallas = 0;
for (const r of resultados) { if (!r.ok) fallas++; console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${!r.ok && r.detalle ? ' — ' + r.detalle : ''}`); }
console.log(`\nConversación: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
process.exit(fallas ? 1 : 0);
