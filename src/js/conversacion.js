/* Conversación (fase 13): mensajes sociales y preguntas de seguimiento. Funciones puras, sin DOM: las usan decision.js,
   main.js y las pruebas en Node. Las listas son cerradas; las respuestas a cada categoría son textos aprobados (plan, sección 6). */
import { norm } from './motor-busqueda.js';

/* Frases de cada categoría, ya normalizadas (minúsculas, sin tildes ni signos). */
const FRASES = {
  saludo: ['hola', 'holi', 'hello', 'buenas', 'buenos dias', 'buen dia', 'buenas tardes', 'buenas noches', 'saludos', 'que tal', 'como esta', 'como estas', 'como va', 'hey'],
  gracias: ['gracias', 'muchas gracias', 'mil gracias', 'le agradezco', 'te agradezco', 'muy amable', 'ok', 'okay', 'vale', 'listo', 'perfecto', 'entendido', 'de acuerdo', 'excelente', 'genial', 'chevere'],
  despedida: ['adios', 'chao', 'chau', 'bye', 'hasta luego', 'hasta pronto', 'hasta manana', 'nos vemos'],
  quien: ['quien eres', 'quien es usted', 'que eres', 'que es usted', 'eres un robot', 'es un robot', 'eres humano', 'eres una persona', 'con quien hablo', 'como te llamas', 'como se llama', 'que puedes hacer', 'que puede hacer', 'para que sirves', 'para que sirve'],
  ayuda: ['ayuda', 'ayudame', 'me ayuda', 'me puede ayudar', 'me puedes ayudar', 'necesito ayuda', 'no entiendo', 'no entendi', 'como funciona', 'como se usa', 'menu', 'opciones', 'que hago']
};
const RELLENO = new Set('a al el la y e o pues bueno bien muy por favor porfa senor senora senorita usted tu asistente bot chat'.split(' '));
const PRIORIDAD = ['quien', 'ayuda', 'despedida', 'gracias', 'saludo'];
const TODAS = Object.entries(FRASES).flatMap(([cat, lista]) => lista.map((f) => [f, cat])).sort((a, b) => b[0].length - a[0].length);
// Al principio de una pregunta solo se quitan los saludos claros («¿cómo está la convocatoria?» no empieza por un saludo).
const SALUDOS = FRASES.saludo.filter((f) => !/^(que|como) /.test(f)).sort((a, b) => b.length - a.length);

/** Categoría social del mensaje (`saludo`, `gracias`, `despedida`, `quien`, `ayuda`) o null si es una pregunta. */
export function clasificarSocial(q) {
  const n = norm(q);
  if (!/[a-z0-9ñ]{2}/.test(n)) return 'ayuda';
  let t = ' ' + n + ' ';
  const halladas = new Set();
  for (const [f, cat] of TODAS) {
    while (t.includes(' ' + f + ' ')) { t = t.replace(' ' + f + ' ', ' '); halladas.add(cat); }
  }
  if (!halladas.size || t.split(' ').some((w) => w && !RELLENO.has(w))) return null;
  return PRIORIDAD.find((c) => halladas.has(c));
}

/** Si el mensaje empieza por un saludo y sigue una pregunta, devuelve la pregunta (normalizada); si no, `q` sin cambios. */
export function quitarSaludo(q) {
  let n = norm(q), cambio = true, quitado = false;
  while (cambio) {
    cambio = false;
    for (const f of SALUDOS) if (n.startsWith(f + ' ')) { n = n.slice(f.length).trim(); cambio = quitado = true; break; }
    const w = n.split(' ')[0];
    if (quitado && RELLENO.has(w) && n.includes(' ')) { n = n.slice(w.length).trim(); cambio = true; }
  }
  return quitado && n ? n : q;
}

/* Palabras que acompañan a una entidad en una pregunta de seguimiento («¿y en Antioquia?», «en el caso de Tunja»). */
const CONECTORES = new Set('y e o en de del la el los las para por con que pasa sobre a al ahora tambien entonces como es hay caso secretaria educacion departamental municipal distrital entidad departamento municipio ciudad distrito certificada territorial'.split(' '));

/** Pregunta de seguimiento: si `q` solo nombra una entidad, devuelve `{ pregunta: anterior, entidad }`; si no, null. */
export function resolverSeguimiento(q, anterior, { detectEntity, entKeys }) {
  if (!anterior) return null;
  const entidad = detectEntity(q);
  if (!entidad) return null;
  const k = entKeys.find((x) => x.e === entidad);
  const propias = new Set(norm(entidad + ' ' + (k ? k.k : '')).split(' '));
  const resto = norm(q).split(' ').filter((w) => w && !CONECTORES.has(w) && !propias.has(w));
  return resto.length ? null : { pregunta: anterior, entidad };
}
