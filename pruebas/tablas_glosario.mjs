// Prueba de la fase 4: tablas con título, lectura fila por fila, glosario literal, temas reservados,
// nota de validez e impresión de una respuesta.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const kb = JSON.parse(readFileSync(path.join(raiz, 'herramientas', 'kb.json'), 'utf8'));
const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: true, voz: '', velocidad: 'normal' };

const navegador = await chromium.launch();
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

async function nueva({ panel = {}, previo = {} } = {}) {
  const contexto = await navegador.newContext();
  await contexto.addInitScript(({ panel, previo }) => {
    window.__leido = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { window.__leido.push(u.text); hablar(u); };
    window.__impreso = [];
    window.print = () => window.__impreso.push(document.documentElement.className + '|' + document.querySelector('#log .imprimiendo')?.dataset.tipo);
    if (!sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true }));
      localStorage.setItem('accesibilidad.preferencias', JSON.stringify(panel));
      for (const [k, v] of Object.entries(previo)) localStorage.setItem(k, JSON.stringify(v));
    }
  }, { panel: { ...PRED, ...panel }, previo });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(url);
  return { contexto, pagina, errores };
}
async function preguntar(pagina, texto, n) {
  await pagina.fill('#pregunta', texto);
  await pagina.press('#pregunta', 'Enter');
  await pagina.waitForFunction((n) => document.querySelectorAll('#log article[data-tipo]').length >= n, n);
}
const axe = async (pagina) => {
  await pagina.evaluate(axeSrc);
  return pagina.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }))
    .violations.map((v) => `${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' ; ')}`));
};
const ultima = (pagina) => pagina.locator('#log article[data-tipo]').last();

/* 1. Tablas: título, encabezados, sin repetir «TABLA No.» como párrafo, lectura fila por fila */
{
  const { contexto, pagina, errores } = await nueva();
  await preguntar(pagina, 'cuantas vacantes ofrece Antioquia', 1);
  const art = ultima(pagina);
  const captions = await art.locator('table > caption').allTextContents();
  prueba('la respuesta de vacantes tiene <caption> en sus tablas', captions.length >= 1 && captions.every((c) => /^TABLA No\. \d/.test(c)), JSON.stringify(captions));
  prueba('el título lleva «TABLA No. N» y el título en mayúsculas', captions.some((c) => /^TABLA No\. 1: [A-ZÁÉÍÓÚÑ ,\-]+$/.test(c)), JSON.stringify(captions));
  const parrafos = await art.locator('.official p').allTextContents();
  prueba('«TABLA No.» no se repite como párrafo', !parrafos.some((p) => /^TABLA No\./.test(p)), JSON.stringify(parrafos.filter((p) => /^TABLA/.test(p))));
  prueba('encabezados con th scope="col"', (await art.locator('table thead th[scope="col"]').count()) >= 3);
  prueba('cada tabla en su contenedor desplazable enfocable', (await art.locator('.tabla-scroll[tabindex="0"] > table').count()) === (await art.locator('table').count()));
  // Lectura fila por fila con el motor del EBAR
  await pagina.click('#log article[data-tipo] [data-speak]');
  await pagina.waitForTimeout(800);
  const leido = await pagina.evaluate(() => window.__leido);
  prueba('la voz anuncia la tabla con su título y tamaño', leido.some((t) => /^Tabla: TABLA número 1/.test(t) && /\d+ filas? y 3 columnas/.test(t)), leido.find((t) => /^Tabla/.test(t)));
  prueba('la voz lee cada fila con su encabezado («Fila 1…», «Vacantes: …»)', leido.some((t) => /^Fila 1/.test(t)) && leido.some((t) => /^Vacantes: \d+/i.test(t)) && leido.some((t) => /^Cargos: /i.test(t)), leido.slice(12, 20).join(' / '));
  prueba('sin errores de consola (tablas)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

/* 2. Glosario */
{
  const { contexto, pagina, errores } = await nueva();
  await preguntar(pagina, '¿qué es la OPEC?', 1);
  const art = ultima(pagina);
  const botones = art.locator('button.glosario-termino');
  const textos = await botones.allTextContents();
  prueba('«¿qué es la OPEC?» trae el botón de glosario «OPEC»', textos.includes('OPEC'), JSON.stringify(textos));
  const unicos = new Set(textos.map((t) => t.toLowerCase()));
  prueba('cada término aparece como botón una sola vez en la respuesta', unicos.size === textos.length, JSON.stringify(textos));
  const boton = art.locator('button.glosario-termino', { hasText: 'OPEC' }).first();
  await boton.click();
  prueba('el glosario abre un diálogo con el término como título', (await pagina.locator('#gl-titulo').textContent()) === 'OPEC' && await pagina.locator('#dlg-glosario').isVisible());
  const opec = kb.glosario.find((g) => g.termino === 'OPEC');
  prueba('la definición es literal (la misma de kb.json)', (await pagina.locator('#gl-definicion').innerText()).replace(/\s+/g, ' ').trim() === opec.definicion.replace(/\s+/g, ' ').trim());
  prueba('fuente con la etiqueta Borrador', /Borrador/.test(await pagina.locator('#gl-fuente').textContent()) && /Fuente: Proyecto de Anexo Técnico Docentes 2026, Numeral 1\.1/.test(await pagina.locator('#gl-fuente').textContent()), await pagina.locator('#gl-fuente').textContent());
  prueba('axe con el glosario abierto', (await axe(pagina)).length === 0);
  await pagina.keyboard.press('Escape');
  prueba('Escape cierra el glosario y el foco vuelve al término', await pagina.evaluate(() => document.activeElement.classList.contains('glosario-termino') && document.activeElement.textContent === 'OPEC'));
  await boton.click(); await pagina.click('#gl-cerrar');
  prueba('«Cerrar» también devuelve el foco al término', await pagina.evaluate(() => document.activeElement.classList.contains('glosario-termino')));
  prueba('los términos son botones y se activan con teclado', await boton.evaluate((b) => b.tagName === 'BUTTON'));
  prueba('sin errores de consola (glosario)', errores.length === 0, errores.join(' / '));
  // educación formal: frase de varias palabras con resaltado entre palabras y definición de dos párrafos
  await preguntar(pagina, 'definición de experiencia docente', 2);
  const t2 = await ultima(pagina).locator('button.glosario-termino').allTextContents();
  prueba('términos de varias palabras (experiencia directiva docente, docente, en otros cargos)', ['experiencia directiva docente', 'experiencia docente', 'experiencia en otros cargos'].every((x) => t2.some((t) => t.toLowerCase() === x)), JSON.stringify(t2));
  await ultima(pagina).locator('button.glosario-termino', { hasText: /^Experiencia Directiva Docente$/i }).click();
  prueba('el glosario de «Experiencia directiva docente» muestra su definición literal', (await pagina.locator('#gl-definicion').textContent()).startsWith('iii) Experiencia Directiva Docente: Es la experiencia profesional'));
  await pagina.keyboard.press('Escape');
  await contexto.close();
}

/* 3. Definiciones del glosario: todas literales y presentes en kb.json */
{
  const { contexto, pagina } = await nueva();
  const anexo = kb.docs.find((d) => d.kind === 'anexo');
  const textoAnexo = (rotulo) => anexo.chunks.filter(([l]) => l === rotulo).map(([, t]) => kb.texts[t]).join('\n').split('\n').filter((l) => !/\(continuación\)\s*$/.test(l)).join('\n');
  prueba('el glosario trae las siete entradas', kb.glosario.length === 7);
  for (const g of kb.glosario) prueba(`definición literal de «${g.termino}»`, textoAnexo(g.fuente.rotulo).includes(g.definicion));
  await contexto.close();
}

/* 4. Temas reservados */
{
  const { contexto, pagina } = await nueva();
  await preguntar(pagina, 'cuánto cuesta la inscripción', 1);
  let art = ultima(pagina);
  prueba('«cuánto cuesta la inscripción» → tema reservado', (await art.getAttribute('data-tipo')) === 'tema-reservado');
  prueba('sin fuente', (await art.getAttribute('data-fuentes')) === '' && (await art.locator('.src').count()) === 0);
  prueba('mensaje de la sección 6', (await art.locator('.plain').textContent()) === 'Este tema está en estudio. El valor de los derechos de participación y la forma de calcularlo se definirán en el acuerdo que apruebe la Sala Plena de la CNSC. Cuando se publique, este asistente mostrará el texto oficial.');
  const bit = await pagina.evaluate(() => JSON.parse(localStorage.getItem('bitacora')));
  prueba('registrado en la bitácora con motivo «Tema reservado»', bit.length === 1 && bit[0].motivo === 'Tema reservado', JSON.stringify(bit));
  const noBloqueadas = [
    ['¿Cómo pago los derechos de participación?', 'faq'],
    ['¿Las personas con discapacidad pagan la inscripción?', 'faq'],
    ['¿Qué pruebas se aplican y cuánto vale cada una?', 'faq'],
    ['cual es la tarifa de inscripcion', 'tema-reservado'],
    ['cuántos pesos cuesta participar en el concurso', 'tema-reservado'],
    ['cuántas personas se inscribieron', null]
  ];
  let n = 1;
  for (const [q, tipo] of noBloqueadas) {
    await preguntar(pagina, q, ++n);
    const t = await ultima(pagina).getAttribute('data-tipo');
    prueba(`«${q}» → ${tipo ?? 'no bloqueada'}`, tipo ? t === tipo : t !== 'tema-reservado', t);
  }
  // Pasajes excluidos: ninguna respuesta con entidad ni sin ella muestra UVT
  let hayUVT = false;
  await pagina.evaluate(() => { document.getElementById('entidad-detalles').open = true; }); // el selector de entidad va plegado
  for (const q of ['cuál es el valor en UVT', 'cuánto es 1,32 UVT', 'qué dice el artículo 6', 'derechos de participación forma de pago', 'unidad de valor tributario']) {
    await pagina.selectOption('#entidad', ''); await preguntar(pagina, q, ++n);
    if (/UVT|valor en pesos/i.test(await ultima(pagina).innerText())) hayUVT = true;
  }
  await pagina.selectOption('#entidad', 'Secretaría de Educación Departamental de Antioquia');
  for (const q of ['qué dice el artículo 6 sobre los derechos de participación', 'parágrafo tercero artículo 6']) { await preguntar(pagina, q, ++n); if (/UVT|valor en pesos/i.test(await ultima(pagina).innerText())) hayUVT = true; }
  prueba('ninguna respuesta muestra pasajes con UVT ni «valor en pesos»', !hayUVT);
  await contexto.close();
}

/* 5. Nota de validez */
{
  const { contexto, pagina } = await nueva();
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar', 1);
  const nota = 'Versión accesible para consulta. Rige el texto del acto administrativo que publique la CNSC.';
  prueba('FAQ: la nota de validez cierra el bloque «Texto oficial»', (await ultima(pagina).locator('.nota-validez').allTextContents()).join('|') === nota);
  await preguntar(pagina, 'qué pasa en la audiencia de escogencia de vacante', 2);
  prueba('pasaje: la nota de validez cierra el bloque «Texto oficial»', (await ultima(pagina).locator('.nota-validez').allTextContents()).join('|') === nota);
  await preguntar(pagina, 'quién gana el mundial de fútbol', 3);
  prueba('«No encontrado» no lleva nota de validez', (await ultima(pagina).locator('.nota-validez').count()) === 0);
  await contexto.close();
}

/* 6. Imprimir */
{
  const { contexto, pagina } = await nueva();
  await preguntar(pagina, 'cuántas vacantes de docente de preescolar hay en Amazonas', 1);
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar', 2);
  const art = pagina.locator('#log article[data-tipo]').first();
  const cerradosAntes = await art.locator('details:not([open])').count();
  await art.locator('[data-print]').click();
  const llamadas = await pagina.evaluate(() => window.__impreso);
  prueba('«Imprimir» llama a imprimir con la clase temporal en la respuesta', llamadas.length === 1 && /imprimiendo-respuesta\|pasaje/.test(llamadas[0]), JSON.stringify(llamadas));
  prueba('los desplegables de esa respuesta se abren para imprimir', (await art.locator('details:not([open])').count()) === 0 && cerradosAntes >= 1);
  await pagina.emulateMedia({ media: 'print' });
  const visible = await pagina.evaluate(() => {
    const v = (sel) => Array.from(document.querySelectorAll(sel)).filter((e) => e.getClientRects().length > 0).length;
    return { cabecera: v('header.top'), pie: v('footer.foot'), formulario: v('#form'), panel: v('.a11y-disparador, .a11y-panel'), aside: v('#temas, #entidad-detalles'), aviso: v('#saludo'),
      respuestas: v('#log > article'), acciones: v('.imprimiendo .actions, .imprimiendo .opinion'), tablas: v('.imprimiendo table'),
      fondo: getComputedStyle(document.body).backgroundColor, texto: getComputedStyle(document.querySelector('.imprimiendo .plain, .imprimiendo .official p') || document.body).color };
  });
  prueba('al imprimir solo se ve esa respuesta (sin cabecera, panel, formulario, pie ni botones)', visible.cabecera === 0 && visible.pie === 0 && visible.formulario === 0 && visible.panel === 0 && visible.aside === 0 && visible.aviso === 0 && visible.respuestas === 1 && visible.acciones === 0, JSON.stringify(visible));
  prueba('texto negro sobre blanco y tablas completas', visible.fondo === 'rgb(255, 255, 255)' && visible.texto === 'rgb(0, 0, 0)' && visible.tablas >= 1, JSON.stringify(visible));
  await pagina.emulateMedia({ media: 'screen' });
  await pagina.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  prueba('tras imprimir se restablece la pantalla', (await pagina.evaluate(() => document.documentElement.className.includes('imprimiendo-respuesta'))) === false && (await art.locator('details:not([open])').count()) === cerradosAntes);
  await contexto.close();
}

/* 7. axe con respuesta de tabla, glosario y tema reservado, en las cuatro variantes y con texto al 200 % */
for (const contraste of ['normal', 'oscuro', 'alto', 'alto-oscuro']) {
  for (const texto of [100, 200]) {
    const { contexto, pagina } = await nueva({ panel: { contraste, texto } });
    await preguntar(pagina, 'cuántas vacantes de docente de preescolar hay en Amazonas', 1);
    await preguntar(pagina, '¿qué es la OPEC?', 2);
    await preguntar(pagina, 'cuánto cuesta la inscripción', 3);
    const v = await axe(pagina);
    prueba(`axe con tabla, glosario y tema reservado (${contraste}, ${texto} %)`, v.length === 0, v.join(' | '));
    await pagina.locator('button.glosario-termino').first().click();
    const v2 = await axe(pagina);
    prueba(`axe con el glosario abierto (${contraste}, ${texto} %)`, v2.length === 0, v2.join(' | '));
    await contexto.close();
  }
}

await navegador.close();
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'tablas_glosario.json'), JSON.stringify({ resultados }, null, 1));
let fallas = 0;
for (const r of resultados) { if (!r.ok) fallas++; console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${!r.ok && r.detalle ? ' — ' + r.detalle : ''}`); }
console.log(`\nTablas, glosario, temas reservados e impresión: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
process.exit(fallas ? 1 : 0);
