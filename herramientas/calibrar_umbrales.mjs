// Calibración de los umbrales del motor (fase 12, paso 12.2). Corre en Node, sin navegador, la misma decisión del asistente
// (src/js/decision.js) con 160 configuraciones, sobre los casos funcionales y el banco de la consulta pública.
// Privacidad: el banco se lee de la carpeta privada; aquí solo se escriben cifras. La muestra para la revisión humana
// (paso 12.3) va a la carpeta privada: node herramientas/calibrar_umbrales.mjs --muestra faqCov=0.6,faqWcov=0.5,...
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SYN } from '../src/js/motor-busqueda.js';
import { crearBase } from '../src/js/base-conocimiento.js';
import { crearReservados } from '../src/js/reservados.js';
import { crearDecisor } from '../src/js/decision.js';
import { UMBRALES_V06 } from '../src/js/umbrales.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...p) => JSON.parse(readFileSync(path.join(raiz, ...p), 'utf8'));
const privado = path.resolve(process.env.PRIVADO_CONSULTA_PUBLICA || path.join(raiz, '..', 'PRIVADO_CONSULTA_PUBLICA'));
const rutaBanco = path.join(privado, 'banco.json');
if (!existsSync(rutaBanco)) { console.error(`ERROR: no existe ${rutaBanco} (fase 10)`); process.exit(1); }

// Los mismos datos que construir.mjs incrusta en el asistente.
const kb = leer('herramientas', 'kb.json'), faq = leer('herramientas', 'faq.json').items;
const sinonimos = existsSync(path.join(raiz, 'herramientas', 'sinonimos_ciudadania.json')) ? leer('herramientas', 'sinonimos_ciudadania.json') : {};
Object.assign(SYN, sinonimos);
const reservados = crearReservados(leer('herramientas', 'temas_reservados.json'));
const decidir = crearDecisor(crearBase(kb, faq, reservados), reservados);
const banco = JSON.parse(readFileSync(rutaBanco, 'utf8'));

// (A) Casos funcionales (sección 7) y preguntas parecidas P1 a P6 (fase 7).
const preguntas = leer('pruebas', 'preguntas.json');
const casos = preguntas.casos.filter((c) => c.desde <= preguntas.fase_actual);
const preguntaDe = new Map(faq.map((f) => [f.id, f.pregunta]));
const P = [['cuánto dura la entrevista', ['entrevista']], ['cuándo salen los resultados', ['reclamacion-escritas', 'reclamacion-vrm']],
  ['cuánto tarda el proceso', ['etapas']], ['qué pasa si no apruebo', []], ['dónde reclamo si no estoy de acuerdo', []], ['quién gana el mundial de fútbol', []]];

function casoOk(c, d) {
  if (c.tipo && d.tipo !== c.tipo) return false;
  if (c.tipo_distinto_de && d.tipo === c.tipo_distinto_de) return false;
  const campo = c.fuente_en === 'fuentes' ? d.rotulos.join(' | ') : d.principal;
  if (c.fuente && !campo.includes(c.fuente)) return false;
  return (d.entidad || '') === c.entidad;
}
const firma = (d) => `${d.tipo}|${d.principal}|${d.entidad || ''}|${(d.parecidas || []).map((f) => f.id).join(',')}`;
const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const coincide = (d, esperada) => Boolean(esperada) && (d.tipo === 'faq' || d.tipo === 'pasaje')
  && new RegExp('^' + escapar(esperada) + '(\\b|,|\\.|$)').test(d.principal) && !new RegExp('^' + escapar(esperada) + '\\d').test(d.principal);

function evaluar(u) {
  const a = casos.map((c) => decidir(c.pregunta, '', u));
  const p = P.map(([q]) => decidir(q, '', u));
  const b = banco.map((x) => decidir(x.pregunta, '', u));
  return { a, p, b };
}
const pct = (n, t) => (t ? Math.round((1000 * n) / t) / 10 : 0);

// Línea base (v0.6)
const base = evaluar(UMBRALES_V06);
const baseFirmasA = base.a.map(firma), baseFirmasP = base.p.map(firma);
const baseOkA = casos.map((c, i) => casoOk(c, base.a[i]));
const baseAciertos = base.b.map((d, i) => coincide(d, banco[i].fuente_esperada));
const respondidas = (b) => b.filter((d) => d.tipo === 'faq' || d.tipo === 'pasaje').length;
const precisionBase = pct(baseAciertos.filter(Boolean).length, respondidas(base.b));

function medir(u, r) {
  const okA = casos.every((c, i) => casoOk(c, r.a[i]) && firma(r.a[i]) === baseFirmasA[i]);
  const pIguales = r.p.every((d, i) => firma(d) === baseFirmasP[i]) && r.p.every((d, i) => JSON.stringify((d.parecidas || []).map((f) => preguntaDe.get(f.id))) === JSON.stringify(P[i][1].map((id) => preguntaDe.get(id))) || d.tipo !== 'no-encontrado');
  const aciertos = r.b.map((d, i) => coincide(d, banco[i].fuente_esperada));
  const tipos = {};
  for (const t of ['faq', 'pasaje', 'depende-entidad', 'no-encontrado', 'tema-reservado']) tipos[t] = pct(r.b.filter((d) => d.tipo === t).length, r.b.length);
  const nuevas = r.b.filter((d, i) => base.b[i].tipo === 'no-encontrado' && d.tipo !== 'no-encontrado').length;
  const cambiadas = r.b.filter((d, i) => base.b[i].tipo !== 'no-encontrado' && d.principal !== base.b[i].principal).length;
  const perdidas = r.b.filter((d, i) => baseAciertos[i] && d.principal !== base.b[i].principal).length;
  const conFuente = aciertos.filter(Boolean).length;
  return { umbrales: u, casosIguales: okA, parecidasIguales: pIguales, tipos, respondidasConFuente: pct(conFuente, banco.length), conFuente,
    precision: pct(conFuente, respondidas(r.b)), nuevas, cambiadas, perdidas };
}

const args = process.argv.slice(2);
const iMuestra = args.indexOf('--muestra');
if (iMuestra >= 0) {
  // Paso 12.3: muestra de hasta 40 respuestas nuevas para la revisión humana (carpeta privada).
  const u = { ...UMBRALES_V06 };
  for (const par of args[iMuestra + 1].split(',')) { const [k, v] = par.split('='); if (!(k in u)) { console.error(`ERROR: umbral desconocido «${k}»`); process.exit(1); } u[k] = Number(v); }
  const r = evaluar(u);
  let semilla = 20261008; const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2147483648) / 2147483648);
  const nuevas = r.b.map((d, i) => ({ d, x: banco[i], i })).filter((o) => base.b[o.i].tipo === 'no-encontrado' && o.d.tipo !== 'no-encontrado');
  for (let i = nuevas.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]]; }
  const muestra = nuevas.slice(0, 40);
  const csv = (s) => '"' + String(s ?? '').replace(/"/g, '""').replace(/\s+/g, ' ') + '"';
  const inicio = (d) => (d.tipo === 'faq' ? d.faq.respuesta : d.pasaje ? d.pasaje.text : '').slice(0, 200);
  const filas = [['id', 'pregunta', 'articulo_observado', 'tipo', 'fuente_principal', 'primeras_palabras_de_la_respuesta', 'pertinente'].join(',')]
    .concat(muestra.map(({ d, x }) => [x.id, x.pregunta, x.articulo_observado, d.tipo, d.principal, inicio(d), ''].map(csv).join(',')));
  writeFileSync(path.join(privado, 'calibracion_muestra.csv'), '﻿' + filas.join('\n'), 'utf8');
  console.log(`Muestra: ${muestra.length} de ${nuevas.length} respuestas nuevas → ${path.join(privado, 'calibracion_muestra.csv')}`);
  process.exit(0);
}

// Paso 12.2: rejilla de 160 configuraciones.
const tabla = [];
for (const faqCov of [0.5, 0.55, 0.6, 0.66]) for (const faqWcov of [0.45, 0.5, 0.55, 0.6])
  for (const pasajeWcov of [0.4, 0.45, 0.5, 0.55, 0.6]) for (const pasajeS of [0.5, 1]) {
    const u = { ...UMBRALES_V06, faqCov, faqWcov, pasajeWcov, pasajeS };
    tabla.push(medir(u, evaluar(u)));
  }
const lineaBase = medir(UMBRALES_V06, base);
const distancia = (u) => Object.keys(UMBRALES_V06).reduce((s, k) => s + Math.abs(u[k] - UMBRALES_V06[k]), 0);
const validas = tabla.filter((t) => t.casosIguales && t.parecidasIguales && t.precision >= precisionBase && t.perdidas === 0);
validas.sort((x, y) => y.conFuente - x.conFuente || distancia(x.umbrales) - distancia(y.umbrales));
const candidata = validas[0] && validas[0].conFuente > lineaBase.conFuente ? validas[0] : null;

const breve = (t) => ({ faqCov: t.umbrales.faqCov, faqWcov: t.umbrales.faqWcov, pasajeWcov: t.umbrales.pasajeWcov, pasajeS: t.umbrales.pasajeS,
  noEncontrado: t.tipos['no-encontrado'], faq: t.tipos.faq, pasaje: t.tipos.pasaje, conFuente: t.respondidasConFuente, precision: t.precision,
  nuevas: t.nuevas, cambiadas: t.cambiadas, perdidas: t.perdidas, casos: t.casosIguales && t.parecidasIguales ? 'iguales' : 'CAMBIAN' });
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'calibracion.json'), JSON.stringify({ fecha: new Date().toISOString(), preguntas: banco.length,
  lineaBase: breve(lineaBase), precisionBase, validas: validas.length, candidata: candidata && breve(candidata), tabla: tabla.map(breve) }, null, 1), 'utf8');

console.log(`Banco: ${banco.length} preguntas; casos funcionales: ${casos.length}; preguntas parecidas: ${P.length}`);
console.log('Línea base (v0.6):', JSON.stringify(breve(lineaBase)));
console.log(`Configuraciones que cumplen las condiciones: ${validas.length} de ${tabla.length}`);
console.log('Mejores 10 entre las que cumplen:');
console.table(validas.slice(0, 10).map(breve));
const mejoresTodas = [...tabla].sort((x, y) => y.conFuente - x.conFuente).slice(0, 5).map(breve);
console.log('Las 5 con más respuestas con la fuente esperada, cumplan o no:');
console.table(mejoresTodas);
console.log('Candidata:', candidata ? JSON.stringify(breve(candidata)) : 'ninguna (ninguna configuración mejora sin romper las condiciones)');
