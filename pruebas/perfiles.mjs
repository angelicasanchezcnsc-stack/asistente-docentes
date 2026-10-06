// Prueba de la bienvenida y los perfiles (fase 3): cada perfil produce su preajuste; teclado, Escape,
// lector externo, recuerdo de preferencias, cambio de perfil con la conversación conservada y lectura automática.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const axeSrc = readFileSync(path.join(raiz, 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');

const PRED = { version: 1, contraste: 'normal', texto: 100, espaciado: 0, interlineado: 0, tipografia: false, dislexia: false,
  facilitado: false, enlaces: false, animaciones: false, cursor: false, pregunta: false, guia: false, foco: false, objetivos: false,
  botonesEscuchar: false, voz: '', velocidad: 'normal' };
const PERFILES = {
  visual: { preajuste: { texto: 150, contraste: 'alto', foco: true, objetivos: true }, lectura: true, nombre: 'Visual' },
  auditivo: { preajuste: {}, lectura: false, nombre: 'Auditivo' },
  fisico: { preajuste: { objetivos: true, foco: true, cursor: true }, lectura: false, nombre: 'Físico' },
  intelectual: { preajuste: { facilitado: true, tipografia: true, interlineado: 1 }, lectura: false, nombre: 'Intelectual' },
  psicosocial: { preajuste: { animaciones: true, facilitado: true, interlineado: 1 }, lectura: false, nombre: 'Psicosocial' },
  sordoceguera: { preajuste: { texto: 200, contraste: 'alto-oscuro', foco: true, objetivos: true, espaciado: 1 }, lectura: false, nombre: 'Sordoceguera' },
  multiple: { preajuste: { texto: 150, contraste: 'alto', objetivos: true, animaciones: true, foco: true }, lectura: false, nombre: 'Múltiple' },
  'adulto-mayor': { preajuste: { texto: 150, interlineado: 1, objetivos: true, foco: true }, lectura: true, nombre: 'Adulto mayor' },
  'sin-preferencia': { preajuste: {}, lectura: false, nombre: 'Sin preferencia' }
};

const navegador = await chromium.launch();
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

async function nueva({ voz = true, previo = null } = {}) {
  const contexto = await navegador.newContext();
  await contexto.addInitScript(({ previo }) => {
    // Espía de la lectura en voz alta: guarda lo que se le pide a speechSynthesis.
    window.__leido = [];
    const hablar = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { window.__leido.push(u.text); hablar(u); };
    if (previo && !sessionStorage.getItem('__previo')) {
      sessionStorage.setItem('__previo', '1');
      for (const [k, v] of Object.entries(previo)) localStorage.setItem(k, JSON.stringify(v));
    }
  }, { previo });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(url);
  return { contexto, pagina, errores };
}
const leerLS = (pagina, clave) => pagina.evaluate((c) => JSON.parse(localStorage.getItem(c) || 'null'), clave);
const leerSS = (pagina, clave) => pagina.evaluate((c) => JSON.parse(sessionStorage.getItem(c) || 'null'), clave);
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

/* 1. Diálogo, foco inicial y teclado */
{
  const { contexto, pagina, errores } = await nueva();
  prueba('el diálogo se abre en la primera visita', await pagina.locator('#dlg-bienvenida').isVisible());
  prueba('título del diálogo', (await pagina.locator('#bv-titulo').textContent()) === 'Antes de empezar: ajuste el asistente a su medida');
  prueba('cuatro pasos con su encabezado', JSON.stringify(await pagina.locator('#dlg-bienvenida h3').allTextContents()) ===
    JSON.stringify(['Paso 1 de 4. Perfil', 'Paso 2 de 4. Lector de pantalla', 'Paso 3 de 4. Presentación', 'Paso 4 de 4. Atajos de teclado']));
  prueba('nueve perfiles', (await pagina.locator('input[name="bv-perfil"]').count()) === 9);
  prueba('foco inicial en el primer perfil', await pagina.evaluate(() => document.activeElement.id === 'bv-p-visual'));
  await pagina.keyboard.press('ArrowDown');
  prueba('flecha abajo elige el siguiente perfil', await pagina.evaluate(() => document.getElementById('bv-p-auditivo').checked));
  prueba('el panel aún no se inició (va después del diálogo)', (await pagina.locator('.a11y-panel').count()) === 0);
  // Tab recorre: perfiles, casillas, recordar, Omitir, Guardar y empezar
  const orden = [];
  for (let i = 0; i < 8; i++) { await pagina.keyboard.press('Tab'); orden.push(await pagina.evaluate(() => document.activeElement.id || document.activeElement.className)); }
  prueba('con Tab se llega a todos los controles', ['bv-lector', 'bv-lectura', 'bv-recordar', 'bv-omitir', 'bv-guardar'].every((id) => orden.includes(id)), orden.join(','));
  // Escape = Omitir
  await pagina.keyboard.press('Escape');
  prueba('Escape cierra el diálogo', await pagina.locator('#dlg-bienvenida').isHidden());
  prueba('al cerrar, el foco va a la caja de pregunta', await pagina.evaluate(() => document.activeElement.id === 'pregunta'));
  const panel = await leerLS(pagina, 'accesibilidad.preferencias');
  prueba('Escape no cambia el panel', panel === null || JSON.stringify(panel) === JSON.stringify(PRED), JSON.stringify(panel));
  prueba('Escape deja registrada la bienvenida y no guarda perfil', (await leerLS(pagina, 'asistente-docentes.preferencias'))?.bienvenida === true);
  prueba('el panel se inicia tras cerrar', (await pagina.locator('.a11y-disparador').count()) === 1);
  await pagina.reload();
  prueba('no vuelve a abrirse', await pagina.locator('#dlg-bienvenida').isHidden());
  prueba('sin errores de consola (diálogo y Escape)', errores.length === 0, errores.join(' / '));
  await contexto.close();
}

/* 2. Cada perfil produce su preajuste */
for (const [id, def] of Object.entries(PERFILES)) {
  const { contexto, pagina, errores } = await nueva();
  await pagina.check(`#bv-p-${id}`);
  const ajustes = await pagina.locator('#bv-ajustes li').count();
  prueba(`${def.nombre}: lista de ajustes en texto`, ajustes === (Object.keys(def.preajuste).length || 1));
  prueba(`${def.nombre}: lectura automática sugerida`, (await pagina.isChecked('#bv-lectura')) === def.lectura);
  await pagina.click('#bv-guardar');
  const esperado = { ...PRED, ...def.preajuste };
  const panel = await leerLS(pagina, 'accesibilidad.preferencias');
  prueba(`${def.nombre}: preajuste del panel`, JSON.stringify(panel) === JSON.stringify(esperado), JSON.stringify(panel));
  const prefs = await leerLS(pagina, 'asistente-docentes.preferencias');
  prueba(`${def.nombre}: perfil y lectura automática guardados`, prefs.perfil === id && prefs.lecturaAutomatica === def.lectura && prefs.lectorExterno === false && prefs.bienvenida === true, JSON.stringify(prefs));
  const attrs = await pagina.evaluate(() => ({ c: document.documentElement.dataset.a11yContraste, t: document.documentElement.dataset.a11yTexto, f: document.documentElement.style.fontSize }));
  prueba(`${def.nombre}: el panel arranca con el preajuste aplicado`, attrs.c === esperado.contraste && attrs.t === String(esperado.texto) && attrs.f === `${esperado.texto * 1.125}%`, JSON.stringify(attrs));
  prueba(`${def.nombre}: foco en la caja de pregunta`, await pagina.evaluate(() => document.activeElement.id === 'pregunta'));
  prueba(`${def.nombre}: sin errores de consola`, errores.length === 0, errores.join(' / '));
  await contexto.close();
}

/* 3. Combina con el estado previo del panel (lo que no aparece queda como esté) */
{
  const previo = { 'accesibilidad.preferencias': { ...PRED, texto: 125, dislexia: true, contraste: 'oscuro' } };
  const { contexto, pagina } = await nueva({ previo });
  await pagina.check('#bv-p-fisico'); await pagina.click('#bv-guardar');
  const panel = await leerLS(pagina, 'accesibilidad.preferencias');
  prueba('el preajuste se combina con el estado previo', panel.texto === 125 && panel.dislexia === true && panel.contraste === 'oscuro' && panel.cursor === true && panel.foco === true && panel.objetivos === true, JSON.stringify(panel));
  await contexto.close();
}

/* 4. Lector de pantalla externo */
{
  const { contexto, pagina } = await nueva();
  await pagina.check('#bv-p-visual');
  prueba('Visual sugiere lectura automática', await pagina.isChecked('#bv-lectura'));
  prueba('el aviso del lector externo está oculto', await pagina.locator('#bv-aviso-lector').isHidden());
  await pagina.check('#bv-lector');
  prueba('con lector externo, la lectura automática se deshabilita y desmarca', (await pagina.isDisabled('#bv-lectura')) && !(await pagina.isChecked('#bv-lectura')));
  prueba('aviso del lector externo con el texto del plan', (await pagina.locator('#bv-aviso-lector').textContent()) === 'Como usa un lector de pantalla, el asistente no leerá en voz alta por su cuenta, para que no se superpongan las dos voces.');
  await pagina.check('#bv-p-adulto-mayor');
  prueba('cambiar de perfil no reactiva la lectura con lector externo', !(await pagina.isChecked('#bv-lectura')));
  prueba('axe con el diálogo abierto y lector externo', (await axe(pagina)).length === 0);
  await pagina.click('#bv-guardar');
  const prefs = await leerLS(pagina, 'asistente-docentes.preferencias');
  prueba('lector externo guardado y lectura automática apagada', prefs.lectorExterno === true && prefs.lecturaAutomatica === false, JSON.stringify(prefs));
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar', 1);
  await pagina.waitForTimeout(500);
  prueba('con lector externo no se lee en voz alta', (await pagina.evaluate(() => window.__leido.length)) === 0);
  await contexto.close();
}

/* 5. Recordar desmarcado → sessionStorage */
{
  const { contexto, pagina } = await nueva();
  await pagina.check('#bv-p-intelectual'); await pagina.uncheck('#bv-recordar'); await pagina.click('#bv-guardar');
  prueba('sin recordar, las preferencias van a sessionStorage', (await leerSS(pagina, 'asistente-docentes.preferencias'))?.perfil === 'intelectual' && (await leerLS(pagina, 'asistente-docentes.preferencias')) === null);
  await pagina.reload();
  prueba('en la misma sesión no vuelve a abrirse', await pagina.locator('#dlg-bienvenida').isHidden());
  await contexto.close();
}

/* 6. Lectura automática */
{
  const { contexto, pagina } = await nueva();
  await pagina.check('#bv-p-visual'); await pagina.click('#bv-guardar');
  await pagina.waitForTimeout(500);
  prueba('la bienvenida no se lee sola al cargar', (await pagina.evaluate(() => window.__leido.length)) === 0);
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar', 1);
  await pagina.waitForTimeout(500);
  const leido = await pagina.evaluate(() => window.__leido.join(' '));
  prueba('lee el bloque «En pocas palabras» y la fuente', /aptitudes/i.test(leido) && /Fuente: Proyecto/.test(leido) && !/Texto oficial\./.test(leido), leido.slice(0, 200));
  await contexto.close();
}

/* 7. Alt + 1 */
{
  const { contexto, pagina } = await nueva({ previo: { 'asistente-docentes.preferencias': { bienvenida: true } } });
  await pagina.focus('#btn-bitacora, #logBtn');
  await pagina.keyboard.press('Alt+1');
  prueba('Alt + 1 lleva a la caja de pregunta', await pagina.evaluate(() => document.activeElement.id === 'pregunta'));
  await contexto.close();
}

/* 8. Cambio de perfil con el botón «Perfil»: conserva la conversación y no duplica la bitácora */
{
  const { contexto, pagina, errores } = await nueva({ previo: { 'asistente-docentes.preferencias': { bienvenida: true } } });
  await preguntar(pagina, 'cuál es el puntaje mínimo para aprobar', 1);
  await preguntar(pagina, 'quién gana el mundial de fútbol', 2);
  await preguntar(pagina, 'cuantas vacantes ofrece Antioquia', 3);
  const antes = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log article[data-tipo]')).map((a) => [a.dataset.tipo, a.dataset.fuentePrincipal, a.dataset.entidad]));
  const bitacoraAntes = await leerLS(pagina, 'bitacora');
  await pagina.click('#btn-perfil');
  prueba('«Perfil» abre el diálogo', await pagina.locator('#dlg-bienvenida').isVisible());
  await pagina.check('#bv-p-fisico');
  await Promise.all([pagina.waitForNavigation(), pagina.click('#bv-guardar')]);
  await pagina.waitForFunction(() => document.querySelectorAll('#log article[data-tipo]').length >= 3);
  const despues = await pagina.evaluate(() => Array.from(document.querySelectorAll('#log article[data-tipo]')).map((a) => [a.dataset.tipo, a.dataset.fuentePrincipal, a.dataset.entidad]));
  prueba('la conversación se conserva idéntica tras el cambio de perfil', JSON.stringify(antes) === JSON.stringify(despues), JSON.stringify(despues));
  prueba('las preguntas del usuario se conservan', (await pagina.locator('#log .msg.user').count()) === 3);
  prueba('el estado del panel tiene el perfil Físico', (await leerLS(pagina, 'accesibilidad.preferencias')).cursor === true);
  prueba('se anuncia «Se aplicó el perfil Físico.»', (await pagina.locator('#status').textContent()) === 'Se aplicó el perfil Físico.');
  prueba('la bitácora no se duplica', JSON.stringify(await leerLS(pagina, 'bitacora')) === JSON.stringify(bitacoraAntes));
  prueba('sin errores de consola en el cambio de perfil', errores.length === 0, errores.join(' / '));
  await pagina.click('#btn-perfil'); await pagina.keyboard.press('Escape');
  prueba('Escape en «Perfil» devuelve el foco al botón «Perfil»', await pagina.evaluate(() => document.activeElement.id === 'btn-perfil'));
  await contexto.close();
}

/* 9. axe con el diálogo abierto en las cuatro variantes y con texto al 200 % */
for (const contraste of ['normal', 'oscuro', 'alto', 'alto-oscuro']) {
  for (const texto of [100, 200]) {
    const previo = { 'accesibilidad.preferencias': { ...PRED, contraste, texto } };
    const { contexto, pagina } = await nueva({ previo });
    const v = await axe(pagina);
    prueba(`axe con la bienvenida abierta (${contraste}, ${texto} %)`, v.length === 0, v.join(' | '));
    await contexto.close();
  }
}

await navegador.close();
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'perfiles.json'), JSON.stringify({ resultados }, null, 1));
let fallas = 0;
for (const r of resultados) { if (!r.ok) fallas++; console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${!r.ok && r.detalle ? ' — ' + r.detalle : ''}`); }
console.log(`\nPerfiles y bienvenida: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
process.exit(fallas ? 1 : 0);
