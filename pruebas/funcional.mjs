// Prueba funcional: abre asistente-docentes.html con file:// y compara cada caso de preguntas.json.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'asistente-docentes.html')).href;
const { fase_actual: fase, casos } = JSON.parse(readFileSync(path.join(raiz, 'pruebas', 'preguntas.json'), 'utf8'));

const navegador = await chromium.launch();
const resultados = [];
for (const c of casos) {
  if (c.desde > fase) { resultados.push({ c, estado: 'OMITIDO', detalle: `desde fase ${c.desde}` }); continue; }
  const contexto = await navegador.newContext();
  // La bienvenida de la fase 3 abre un diálogo modal en la primera visita: aquí se da por vista.
  await contexto.addInitScript(() => { try { localStorage.setItem('asistente-docentes.preferencias', JSON.stringify({ bienvenida: true })); } catch (e) {} });
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  pagina.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await pagina.goto(url);
  await pagina.fill('#pregunta', c.pregunta);
  await pagina.press('#pregunta', 'Enter');
  let obtenido = {};
  try {
    await pagina.waitForSelector('#log article[data-tipo]', { timeout: 8000 });
    obtenido = await pagina.$eval('#log article[data-tipo]:last-of-type', a => ({
      tipo: a.dataset.tipo, fuentes: a.dataset.fuentes, principal: a.dataset.fuentePrincipal, entidad: a.dataset.entidad
    }));
    if (c.boton_glosario) obtenido.glosario = await pagina.locator(`#log article[data-tipo] button:text-is("${c.boton_glosario}")`).count();
  } catch (e) { obtenido = { error: 'sin respuesta en 8 s' }; }
  const fallas = [];
  if (obtenido.error) fallas.push(obtenido.error);
  else {
    if (c.tipo && obtenido.tipo !== c.tipo) fallas.push(`tipo ${obtenido.tipo} ≠ ${c.tipo}`);
    if (c.tipo_distinto_de && obtenido.tipo === c.tipo_distinto_de) fallas.push(`tipo ${obtenido.tipo} no debía ser ${c.tipo_distinto_de}`);
    // «Fuente contiene» se compara con data-fuente-principal; en las preguntas frecuentes con varias fuentes (fuente_en: "fuentes"), con data-fuentes.
    const campo = c.fuente_en === 'fuentes' ? 'fuentes' : 'principal';
    if (c.fuente && !obtenido[campo].includes(c.fuente)) fallas.push(`${campo} «${obtenido[campo]}» no contiene «${c.fuente}»`);
    if ((obtenido.entidad || '') !== c.entidad) fallas.push(`entidad «${obtenido.entidad}» ≠ «${c.entidad}»`);
    if (c.boton_glosario && !obtenido.glosario) fallas.push(`falta botón de glosario «${c.boton_glosario}»`);
  }
  if (errores.length) fallas.push('errores de consola: ' + errores.join(' / '));
  resultados.push({ c, obtenido, estado: fallas.length ? 'FALLA' : 'OK', detalle: fallas.join('; ') });
  await contexto.close();
}
await navegador.close();

for (const r of resultados) {
  const o = r.obtenido || {};
  console.log(`${String(r.c.n).padStart(2)} ${r.estado.padEnd(7)} ${r.c.pregunta}`);
  if (r.estado !== 'OMITIDO') console.log(`     tipo=${o.tipo} | principal=${o.principal} | fuentes=${o.fuentes} | entidad=${o.entidad}`);
  if (r.detalle) console.log(`     ${r.detalle}`);
}
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'funcional.json'), JSON.stringify({ fase, casos: resultados.map(r => ({ n: r.c.n, pregunta: r.c.pregunta, estado: r.estado, tipo: r.obtenido?.tipo ?? '', principal: r.obtenido?.principal ?? '', entidad: r.obtenido?.entidad ?? '', detalle: r.detalle })) }, null, 1));
const n = e => resultados.filter(r => r.estado === e).length;
console.log(`\nFase ${fase}: ${n('OK')} OK, ${n('FALLA')} con diferencias, ${n('OMITIDO')} omitidos`);
process.exit(n('FALLA') ? 1 : 0);
