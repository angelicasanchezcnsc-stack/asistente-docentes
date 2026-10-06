// Pruebas de accesibilidad (fase 5) con Playwright y axe-core, y generación de pruebas/INFORME_PRUEBAS.md.
//  1. axe (wcag2a, wcag2aa, wcag21aa y best-practice) en las cuatro variantes de contraste, con texto al 100 % y al 200 %,
//     con respuestas en pantalla (pregunta frecuente, pasaje con tabla y «No encontrado»), con el panel abierto y con la bienvenida abierta.
//  2. Reflujo: 320 px de ancho y texto al 200 %, sin desplazamiento horizontal salvo dentro de las tablas.
//  3. Teclado, 4. voz sin voz local, 5. región viva.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const paquete = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf8'));

const CONTRASTES = ['normal', 'oscuro', 'alto', 'alto-oscuro'];
const TEXTOS = [100, 200];
const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: false, voz: '', velocidad: 'normal' };
const PREGUNTAS = {
  faq: '¿cuál es el puntaje mínimo para aprobar?',
  pasajeConTabla: 'cuántas vacantes de docente de preescolar hay en Amazonas',
  noEncontrado: 'quién gana el mundial de fútbol'
};

const navegador = await chromium.launch();
const axeResultados = [], reflujo = [], teclado = [], voz = [], regionViva = [];

/** Contexto nuevo. `vista`: la bienvenida ya vista (no abre el diálogo). `panel`: estado del panel. */
async function nueva({ panel = {}, vista = true, viewport = { width: 1100, height: 900 }, voces = null } = {}) {
  const contexto = await navegador.newContext({ viewport });
  await contexto.addInitScript(({ panel, vista, voces }) => {
    if (!sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify(panel));
      if (vista) localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true }));
    }
    if (voces) Object.defineProperty(speechSynthesis, 'getVoices', { value: () => voces });
  }, { panel: { ...PRED, ...panel }, vista, voces });
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
async function preguntar(pagina, texto, n) {
  await pagina.fill('#pregunta', texto);
  await pagina.press('#pregunta', 'Enter');
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length >= n, n);
}
/** Las tres respuestas del plan en pantalla, con sus desplegables abiertos para que la tabla se vea. */
async function conRespuestas(pagina) {
  await preguntar(pagina, PREGUNTAS.faq, 1);
  await preguntar(pagina, PREGUNTAS.pasajeConTabla, 2);
  await preguntar(pagina, PREGUNTAS.noEncontrado, 3);
  await pagina.evaluate(() => document.querySelectorAll('#log details').forEach((d) => d.setAttribute('open', '')));
}

/* 1. axe */
for (const contraste of CONTRASTES) {
  for (const texto of TEXTOS) {
    const etiqueta = `${contraste}, ${texto} %`;
    {
      const { contexto, pagina } = await nueva({ panel: { contraste, texto, botonesEscuchar: true } });
      await conRespuestas(pagina);
      const tablas = await pagina.locator('#log table:visible').count();
      axeResultados.push({ combinacion: etiqueta, estado: 'respuestas en pantalla (frecuente, pasaje con tabla, «No encontrado»)', violaciones: await axe(pagina), nota: `${tablas} tablas visibles` });
      await pagina.click('#btn-accesibilidad');
      await pagina.waitForSelector('.a11y-panel--abierto');
      axeResultados.push({ combinacion: etiqueta, estado: 'panel de accesibilidad abierto', violaciones: await axe(pagina) });
      await contexto.close();
    }
    {
      const { contexto, pagina } = await nueva({ panel: { contraste, texto }, vista: false });
      await pagina.waitForSelector('#dlg-bienvenida[open]');
      axeResultados.push({ combinacion: etiqueta, estado: 'bienvenida abierta', violaciones: await axe(pagina) });
      await contexto.close();
    }
  }
}

/* 2. Reflujo: 320 px y texto al 200 % */
async function medirReflujo(pagina) {
  return pagina.evaluate(() => {
    const ancho = window.innerWidth;
    const fuera = [];
    for (const e of document.querySelectorAll('body *')) {
      if (e.closest('.tabla-scroll, .a11y-panel, .a11y-disparador, dialog:not([open])')) continue;
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > ancho + 1) fuera.push(`${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} (${Math.round(r.right)} px)`);
    }
    const dialogo = document.querySelector('dialog[open]');
    return { pagina: document.documentElement.scrollWidth, ventana: ancho, fuera: fuera.slice(0, 6),
      dialogo: dialogo ? { cliente: dialogo.clientWidth, contenido: dialogo.scrollWidth } : null,
      cuerpoDialogo: dialogo ? (() => { const b = dialogo.querySelector('.dlg-b'); return b ? { cliente: b.clientWidth, contenido: b.scrollWidth } : null; })() : null };
  });
}
for (const contraste of CONTRASTES) {
  const vista320 = { width: 320, height: 640 };
  {
    const { contexto, pagina } = await nueva({ panel: { contraste, texto: 200 }, viewport: vista320 });
    await conRespuestas(pagina);
    const m = await medirReflujo(pagina);
    reflujo.push({ combinacion: `${contraste}, 320 px, 200 %`, estado: 'respuestas en pantalla', ok: m.pagina <= m.ventana + 1, medida: `scrollWidth ${m.pagina} px, ventana ${m.ventana} px${m.fuera.length ? '; se salen: ' + m.fuera.join(', ') : ''}` });
    await pagina.click('#btn-accesibilidad');
    await pagina.waitForSelector('.a11y-panel--abierto');
    await pagina.waitForTimeout(500); // termina la transición de entrada del panel
    const p = await pagina.evaluate(() => { const e = document.querySelector('.a11y-panel'); const c = e.querySelector('.a11y-panel__cuerpo'); const r = e.getBoundingClientRect(); return { derecha: Math.round(r.right), ventana: innerWidth, interno: c.scrollWidth - c.clientWidth }; });
    reflujo.push({ combinacion: `${contraste}, 320 px, 200 %`, estado: 'panel de accesibilidad abierto', ok: p.derecha <= p.ventana + 1 && p.interno <= 1, medida: `borde derecho ${p.derecha} px de ${p.ventana}; desborde interno ${p.interno} px` });
    await contexto.close();
  }
  {
    const { contexto, pagina } = await nueva({ panel: { contraste, texto: 200 }, viewport: vista320, vista: false });
    await pagina.waitForSelector('#dlg-bienvenida[open]');
    const m = await medirReflujo(pagina);
    reflujo.push({ combinacion: `${contraste}, 320 px, 200 %`, estado: 'bienvenida abierta', ok: m.pagina <= m.ventana + 1 && m.dialogo.contenido <= m.dialogo.cliente + 1 && m.cuerpoDialogo.contenido <= m.cuerpoDialogo.cliente + 1, medida: `scrollWidth ${m.pagina} px, ventana ${m.ventana} px; diálogo ${m.dialogo.contenido}/${m.dialogo.cliente} px; contenido ${m.cuerpoDialogo.contenido}/${m.cuerpoDialogo.cliente} px` });
    await contexto.close();
  }
}

/* 3. Teclado */
{
  const { contexto, pagina, errores } = await nueva();
  const activo = () => pagina.evaluate(() => ({ id: document.activeElement.id, texto: document.activeElement.textContent.trim().slice(0, 60) }));
  await pagina.keyboard.press('Tab');
  const a = await activo();
  teclado.push({ prueba: 'Desde la carga, la primera parada de Tab es «Saltar a escribir la pregunta»', ok: a.texto === 'Saltar a escribir la pregunta', medida: a.texto });
  await pagina.keyboard.press('Enter');
  teclado.push({ prueba: 'Enter sobre ese enlace lleva el foco a la caja de pregunta', ok: (await activo()).id === 'pregunta', medida: (await activo()).id });
  await pagina.click('#logBtn');
  await pagina.keyboard.press('Escape');
  await pagina.focus('#btn-accesibilidad');
  await pagina.keyboard.press('Alt+1');
  teclado.push({ prueba: 'Alt + 1 lleva a la caja de pregunta', ok: (await activo()).id === 'pregunta', medida: (await activo()).id });
  await pagina.fill('#pregunta', PREGUNTAS.faq);
  await pagina.keyboard.press('Enter');
  await pagina.waitForSelector('#log article[data-tipo]');
  teclado.push({ prueba: 'Enter en la caja de pregunta envía la pregunta y aparece la respuesta', ok: (await pagina.locator('#log article[data-tipo]').count()) === 1 && (await pagina.inputValue('#pregunta')) === '', medida: 'una respuesta en pantalla y la caja vacía' });
  await pagina.keyboard.press('Alt+a');
  const abierto = await pagina.locator('#a11y-panel').isVisible();
  teclado.push({ prueba: 'Alt + A abre el panel de accesibilidad', ok: abierto, medida: abierto ? 'panel visible' : 'panel oculto' });
  await pagina.keyboard.press('Escape');
  const cerrado = await pagina.locator('#a11y-panel').isHidden();
  teclado.push({ prueba: 'Escape cierra el panel y devuelve el foco a donde estaba', ok: cerrado && (await activo()).id === 'pregunta', medida: `panel ${cerrado ? 'oculto' : 'visible'}, foco en #${(await activo()).id}` });
  // Tab recorre todos los controles de la página sin trampas (hasta volver al inicio)
  const vistos = new Set();
  for (let i = 0; i < 80; i++) { await pagina.keyboard.press('Tab'); vistos.add(await pagina.evaluate(() => document.activeElement.id || document.activeElement.className || document.activeElement.tagName)); }
  teclado.push({ prueba: 'Tab alcanza los botones de la cabecera, el selector de entidad y la caja de pregunta', ok: ['btn-perfil', 'btn-accesibilidad', 'logBtn', 'entidad', 'pregunta'].every((id) => vistos.has(id)), medida: `${vistos.size} controles distintos` });
  teclado.push({ prueba: 'Sin errores de consola durante la prueba de teclado', ok: errores.length === 0, medida: errores.join(' / ') || 'ninguno' });
  await contexto.close();
}

/* 4. Voz: una sola voz en español que no es local */
{
  const voces = [{ name: 'Voz en línea', lang: 'es-CO', voiceURI: 'en-linea', localService: false, default: true }];
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true }, voces });
  await preguntar(pagina, PREGUNTAS.faq, 1);
  const art = pagina.locator('#log article[data-tipo]').last();
  const boton = art.locator('[data-speak]');
  const aviso = art.locator('.sin-voz');
  voz.push({ prueba: 'Con solo una voz en línea, «Escuchar» está visible pero deshabilitado', ok: (await boton.isVisible()) && (await boton.isDisabled()), medida: `visible ${await boton.isVisible()}, deshabilitado ${await boton.isDisabled()}` });
  const textoAviso = (await aviso.textContent()).trim();
  voz.push({ prueba: 'Debajo aparece el aviso «Sin voz local» de la sección 6', ok: (await aviso.isVisible()) && textoAviso === 'Este equipo no tiene instalada una voz en español. En Windows puede agregarla en Configuración, Hora e idioma, Voz; en Android y en iPhone, en los ajustes de accesibilidad o de texto a voz.', medida: textoAviso.slice(0, 70) + '…' });
  await pagina.click('#btn-accesibilidad');
  voz.push({ prueba: 'El panel también deshabilita la lectura y su interruptor', ok: (await pagina.locator('.a11y-interruptor').isDisabled()) && (await pagina.locator('.a11y-control--principal').isDisabled()), medida: 'interruptor y «Reproducir» deshabilitados' });
  const hablo = await pagina.evaluate(() => speechSynthesis.speaking || speechSynthesis.pending);
  voz.push({ prueba: 'No se usa la voz en línea: la síntesis no empieza', ok: !hablo, medida: hablo ? 'empezó a hablar' : 'sin lectura' });
  await contexto.close();
}
{
  const voces = [{ name: 'Voz en inglés', lang: 'en-US', voiceURI: 'en', localService: true, default: true }];
  const { contexto, pagina } = await nueva({ panel: { botonesEscuchar: true }, voces });
  await preguntar(pagina, PREGUNTAS.faq, 1);
  const boton = pagina.locator('#log article[data-tipo] [data-speak]').last();
  voz.push({ prueba: 'Con una voz local que no es en español, «Escuchar» también queda deshabilitado', ok: await boton.isDisabled(), medida: `deshabilitado ${await boton.isDisabled()}` });
  await contexto.close();
}

/* 5. Región viva */
{
  const { contexto, pagina } = await nueva();
  const log = pagina.locator('#log');
  regionViva.push({ prueba: 'La conversación tiene role="log"', ok: (await log.getAttribute('role')) === 'log', medida: `role="${await log.getAttribute('role')}"` });
  regionViva.push({ prueba: 'Es una región viva cortés que anuncia solo lo que se agrega', ok: (await log.getAttribute('aria-live')) === 'polite' && (await log.getAttribute('aria-relevant')) === 'additions', medida: `aria-live="${await log.getAttribute('aria-live')}", aria-relevant="${await log.getAttribute('aria-relevant')}"` });
  regionViva.push({ prueba: 'Tiene nombre accesible', ok: Boolean(await log.getAttribute('aria-label')), medida: await log.getAttribute('aria-label') });
  await conRespuestas(pagina);
  const m = await pagina.evaluate(() => ({ respuestas: document.querySelectorAll('article.msg.bot').length, dentro: document.querySelectorAll('#log article.msg.bot').length, usuario: document.querySelectorAll('.msg.user').length, usuarioDentro: document.querySelectorAll('#log .msg.user').length }));
  regionViva.push({ prueba: 'Cada respuesta nueva (y la bienvenida del chat) queda dentro de la región', ok: m.respuestas === 4 && m.dentro === m.respuestas && m.usuario === m.usuarioDentro, medida: `${m.dentro} de ${m.respuestas} respuestas y ${m.usuarioDentro} de ${m.usuario} preguntas dentro del #log` });
  const estado = await pagina.locator('#status').getAttribute('role');
  regionViva.push({ prueba: 'El estado «Respuesta lista.» está en una región role="status" aparte', ok: estado === 'status', medida: `role="${estado}"` });
  await contexto.close();
}

await navegador.close();

/* ---------- Resultados y informe ---------- */
const carpeta = path.join(raiz, 'pruebas', 'resultados');
mkdirSync(carpeta, { recursive: true });
const leer = (n) => { const f = path.join(carpeta, n + '.json'); return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
const funcional = leer('funcional'), perfiles = leer('perfiles'), tablas = leer('tablas_glosario');
const ok = (v) => (v ? 'OK' : '**FALLA**');
const versionVisible = (readFileSync(path.join(raiz, 'src', 'index.html'), 'utf8').match(/<span class="ver mono">([^<]+)</) || [])[1] || '';
const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Bogota' });
const celda = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');

const md = [];
md.push('# Informe de pruebas — Asistente Docentes', '');
md.push(`- **Fecha:** ${fecha}`);
md.push(`- **Versión:** ${paquete.version} (paquete); versión visible en la interfaz: ${versionVisible}`);
md.push('- **Navegador:** Chromium (Playwright), archivo abierto con `file://`, sin servidor y sin internet');
md.push('- **Reglas de axe:** `wcag2a`, `wcag2aa`, `wcag21aa`, `best-practice`', '');

md.push('## 1. Casos funcionales', '');
if (funcional) {
  md.push(`Fase del plan: ${funcional.fase}. Cada caso se ejecuta con la entidad vacía y una página nueva.`, '');
  md.push('| # | Pregunta | Resultado | Tipo | Fuente principal | Entidad |', '| --- | --- | --- | --- | --- | --- |');
  for (const c of funcional.casos) md.push(`| ${c.n} | ${celda(c.pregunta)} | ${c.estado === 'OK' ? 'OK' : c.estado === 'OMITIDO' ? 'Omitido' : '**FALLA** ' + celda(c.detalle)} | ${celda(c.tipo)} | ${celda(c.principal) || '—'} | ${celda(c.entidad) || '—'} |`);
  md.push('');
} else md.push('_Sin resultados: ejecute `node pruebas/funcional.mjs` antes._', '');

md.push('## 2. axe por combinación', '');
md.push('Cada fila es una variante de contraste con un tamaño de texto y un estado de la pantalla. Se espera cero violaciones.', '');
md.push('| Contraste y texto | Estado | Violaciones | Resultado |', '| --- | --- | --- | --- |');
for (const r of axeResultados) md.push(`| ${r.combinacion} | ${r.estado}${r.nota ? ' (' + r.nota + ')' : ''} | ${r.violaciones.length ? celda(r.violaciones.join(' · ')) : '0'} | ${ok(r.violaciones.length === 0)} |`);
md.push('');

md.push('## 3. Reflujo (320 px de ancho y texto al 200 %)', '');
md.push('Criterio: `document.documentElement.scrollWidth <= innerWidth + 1`, salvo dentro de las tablas, que se desplazan en su propio contenedor.', '');
md.push('| Contraste | Estado | Medida | Resultado |', '| --- | --- | --- | --- |');
for (const r of reflujo) md.push(`| ${r.combinacion} | ${r.estado} | ${celda(r.medida)} | ${ok(r.ok)} |`);
md.push('');

const tablaSimple = (titulo, filas) => { md.push(`## ${titulo}`, '', '| Prueba | Medida | Resultado |', '| --- | --- | --- |'); for (const r of filas) md.push(`| ${celda(r.prueba)} | ${celda(r.medida)} | ${ok(r.ok)} |`); md.push(''); };
tablaSimple('4. Teclado', teclado);
tablaSimple('5. Voz sin voz local', voz);
tablaSimple('6. Región viva', regionViva);

const listar = (titulo, datos) => { if (!datos) return; const f = datos.resultados.filter((r) => !r.ok); md.push(`## ${titulo}`, '', `${datos.resultados.length - f.length} de ${datos.resultados.length} comprobaciones en verde.` + (f.length ? ' Con diferencias:' : ''), ''); for (const r of f) md.push(`- ${celda(r.nombre)} — ${celda(r.detalle)}`); md.push(''); };
listar('7. Bienvenida y perfiles (`pruebas/perfiles.mjs`)', perfiles);
listar('8. Tablas, glosario, temas reservados e impresión (`pruebas/tablas_glosario.mjs`)', tablas);

md.push('## 9. Pruebas manuales pendientes', '', 'Las deben hacer personas; ninguna se puede dar por hecha con pruebas automáticas.', '');
md.push('- [ ] NVDA con Firefox y JAWS con Chrome en Windows: bienvenida, pregunta, respuesta con tabla, glosario y panel.');
md.push('- [ ] VoiceOver en iPhone (Safari) y TalkBack en Android (Chrome).');
md.push('- [ ] Lectura en voz alta con una voz local instalada (en Windows, Microsoft Sabina o Raúl).');
md.push('- [ ] Zoom del navegador al 400 % en computador.');
md.push('- [ ] Validación de los textos de los perfiles y de las preguntas frecuentes con personas con discapacidad.', '');

const todo = [...axeResultados.map((r) => r.violaciones.length === 0), ...reflujo.map((r) => r.ok), ...teclado.map((r) => r.ok), ...voz.map((r) => r.ok), ...regionViva.map((r) => r.ok)];
const falla = todo.filter((x) => !x).length;
const casosFalla = funcional ? funcional.casos.filter((c) => c.estado === 'FALLA').length : 0;
md.push('## Resumen', '', `- axe: ${axeResultados.filter((r) => r.violaciones.length === 0).length} de ${axeResultados.length} combinaciones sin violaciones.`,
  `- Reflujo: ${reflujo.filter((r) => r.ok).length} de ${reflujo.length}.`, `- Teclado: ${teclado.filter((r) => r.ok).length} de ${teclado.length}.`,
  `- Voz: ${voz.filter((r) => r.ok).length} de ${voz.length}.`, `- Región viva: ${regionViva.filter((r) => r.ok).length} de ${regionViva.length}.`,
  `- Casos funcionales con diferencias: ${casosFalla}.`, '');
writeFileSync(path.join(raiz, 'pruebas', 'INFORME_PRUEBAS.md'), md.join('\n'), 'utf8');

for (const r of axeResultados) if (r.violaciones.length) console.log(`FALLA axe ${r.combinacion} — ${r.estado}: ${r.violaciones.join(' | ')}`);
for (const r of reflujo) if (!r.ok) console.log(`FALLA reflujo ${r.combinacion} — ${r.estado}: ${r.medida}`);
for (const [n, l] of [['teclado', teclado], ['voz', voz], ['región viva', regionViva]]) for (const r of l) if (!r.ok) console.log(`FALLA ${n}: ${r.prueba} — ${r.medida}`);
console.log(`Accesibilidad: axe ${axeResultados.length - axeResultados.filter((r) => r.violaciones.length).length}/${axeResultados.length}, reflujo ${reflujo.filter((r) => r.ok).length}/${reflujo.length}, teclado ${teclado.filter((r) => r.ok).length}/${teclado.length}, voz ${voz.filter((r) => r.ok).length}/${voz.length}, región viva ${regionViva.filter((r) => r.ok).length}/${regionViva.length}. Informe: pruebas/INFORME_PRUEBAS.md`);
process.exit(falla || casosFalla ? 1 : 0);
