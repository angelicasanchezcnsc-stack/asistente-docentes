// Prueba de la fase 12: umbrales del motor. Corre en Node, sin navegador, la misma decisión del asistente (decision.js).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SYN } from '../src/js/motor-busqueda.js';
import { crearBase } from '../src/js/base-conocimiento.js';
import { crearReservados } from '../src/js/reservados.js';
import { crearDecisor } from '../src/js/decision.js';
import { UMBRALES, UMBRALES_V06 } from '../src/js/umbrales.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...p) => JSON.parse(readFileSync(path.join(raiz, ...p), 'utf8'));
const resultados = [];
const prueba = (nombre, ok, detalle = '') => resultados.push({ nombre, ok: Boolean(ok), detalle });

const faq = leer('herramientas', 'faq.json').items;
if (existsSync(path.join(raiz, 'herramientas', 'sinonimos_ciudadania.json'))) Object.assign(SYN, leer('herramientas', 'sinonimos_ciudadania.json'));
const reservados = crearReservados(leer('herramientas', 'temas_reservados.json'));
const decidir = crearDecisor(crearBase(leer('herramientas', 'kb.json'), faq, reservados), reservados);

// 1. Forma de los umbrales
const claves = Object.keys(UMBRALES_V06);
prueba('UMBRALES y UMBRALES_V06 tienen las mismas claves', JSON.stringify(Object.keys(UMBRALES).sort()) === JSON.stringify([...claves].sort()), Object.keys(UMBRALES).join(', '));
prueba('valores entre 0 y 1 (pasajeS entre 0 y 2)', claves.every((k) => typeof UMBRALES[k] === 'number' && UMBRALES[k] >= 0 && UMBRALES[k] <= (k === 'pasajeS' ? 2 : 1)), JSON.stringify(UMBRALES));
prueba('UMBRALES_V06 conserva los valores de la v0.1 a la v0.6', JSON.stringify(UMBRALES_V06) === JSON.stringify({ faqCov: 0.66, faqWcov: 0.6, pasajeWcov: 0.6, pasajeS: 1, especificidad: 0.8, relacionadas: 0.5, parecidas: 0.5, cercano: 0.3 }));
prueba('UMBRALES_V06 está congelado', Object.isFrozen(UMBRALES_V06));

// 2. Sin umbrales escritos a mano fuera de umbrales.js
for (const archivo of ['respuestas.js', 'decision.js']) {
  const codigo = readFileSync(path.join(raiz, 'src', 'js', archivo), 'utf8');
  const hallados = codigo.match(/(cov|wcov|\.s)\s*[<>]=?\s*\.?\d/g) || [];
  prueba(`${archivo}: no compara cov, wcov ni s con números escritos a mano`, hallados.length === 0, hallados.join(' '));
}

// 3. Casos funcionales y preguntas parecidas con UMBRALES_V06 y con UMBRALES
const preguntas = leer('pruebas', 'preguntas.json');
const casos = preguntas.casos.filter((c) => c.desde <= preguntas.fase_actual);
const preguntaDe = new Map(faq.map((f) => [f.id, f.pregunta]));
const P = [['P1', 'cuánto dura la entrevista', ['entrevista']], ['P2', 'cuándo salen los resultados', ['reclamacion-escritas', 'reclamacion-vrm']],
  ['P3', 'cuánto tarda el proceso', ['etapas']], ['P4', 'qué pasa si no apruebo', []], ['P5', 'dónde reclamo si no estoy de acuerdo', []], ['P6', 'quién gana el mundial de fútbol', []]];
const casoOk = (c, d) => (!c.tipo || d.tipo === c.tipo) && (!c.tipo_distinto_de || d.tipo !== c.tipo_distinto_de)
  && (!c.fuente || (c.fuente_en === 'fuentes' ? d.rotulos.join(' | ') : d.principal).includes(c.fuente)) && (d.entidad || '') === c.entidad;
for (const [nombre, u] of [['UMBRALES_V06', UMBRALES_V06], ['UMBRALES', UMBRALES]]) {
  const fallan = casos.filter((c) => !casoOk(c, decidir(c.pregunta, '', u))).map((c) => c.n);
  prueba(`${nombre}: los ${casos.length} casos funcionales dan lo esperado`, fallan.length === 0, `fallan: ${fallan.join(', ')}`);
  const pFallan = P.filter(([, q, ids]) => { const d = decidir(q, '', u); return d.tipo !== 'no-encontrado' || JSON.stringify(d.parecidas.map((f) => f.pregunta)) !== JSON.stringify(ids.map((id) => preguntaDe.get(id))); }).map(([id]) => id);
  prueba(`${nombre}: P1 a P6 dan «No encontrado» con las preguntas parecidas esperadas`, pFallan.length === 0, `fallan: ${pFallan.join(', ')}`);
}

// 4. Resultados (para el informe): valores en uso y resumen de la calibración, si existe
const calibracion = existsSync(path.join(raiz, 'pruebas', 'resultados', 'calibracion.json')) ? leer('pruebas', 'resultados', 'calibracion.json') : null;
mkdirSync(path.join(raiz, 'pruebas', 'resultados'), { recursive: true });
writeFileSync(path.join(raiz, 'pruebas', 'resultados', 'umbrales.json'), JSON.stringify({ fecha: new Date().toISOString(), umbrales: UMBRALES, v06: UMBRALES_V06,
  calibracion: calibracion && { validas: calibracion.validas, configuraciones: calibracion.tabla.length, candidata: calibracion.candidata, lineaBase: calibracion.lineaBase }, resultados }, null, 1), 'utf8');
for (const r of resultados) console.log(`${r.ok ? 'OK   ' : 'FALLA'} ${r.nombre}${r.ok ? '' : ' — ' + r.detalle}`);
const fallas = resultados.filter((r) => !r.ok).length;
console.log(`\nUmbrales del motor: ${resultados.length - fallas} OK, ${fallas} con diferencias`);
if (fallas) process.exit(1);
