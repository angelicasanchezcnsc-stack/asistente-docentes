/**
 * Normalización de denominaciones académicas y medidas de parecido.
 *
 * Todo el cotejo (diploma ↔ SNIES ↔ Manual de Funciones) pasa por aquí, para
 * que una tilde, una mayúscula, un guion o un «Lic.» no cambien el resultado.
 */

/** Minúsculas, sin tildes ni diéresis, sin signos; espacios simples. La ñ se conserva como n. */
export function normalizar(texto: string | null | undefined): string {
  if (!texto) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Abreviaturas y variantes de redacción frecuentes en diplomas y en el SNIES.
 * Se aplican sobre texto ya normalizado, por palabra completa.
 */
const SINONIMOS: Array<[RegExp, string]> = [
  [/\blic\b/g, 'licenciatura'],
  [/\blicenciad[oa]s?\b/g, 'licenciatura'],
  [/\blicenciaturas\b/g, 'licenciatura'],
  [/\besp\b/g, 'especializacion'],
  [/\bespecialista\b/g, 'especializacion'],
  [/\bmagister\b/g, 'maestria'],
  [/\bmagistra\b/g, 'maestria'],
  [/\bmsc\b/g, 'maestria'],
  [/\bdoctor[a]?\b/g, 'doctorado'],
  [/\bphd\b/g, 'doctorado'],
  [/\bing\b/g, 'ingenieria'],
  [/\bingenier[oa]s?\b/g, 'ingenieria'],
  [/\bed\b/g, 'educacion'],
  [/\bmatematica\b/g, 'matematicas'],
  [/\bciencia naturales\b/g, 'ciencias naturales'],
  [/\bcastellano\b/g, 'castellana'],
];

/** Palabras que no distinguen un programa de otro. */
const VACIAS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'e', 'o', 'u', 'con', 'para', 'por', 'a', 'al',
  'titulo', 'programa', 'profesional',
]);

/** Normaliza y unifica variantes («Licenciado en…» ≡ «Licenciatura en…»). */
export function canonizar(texto: string | null | undefined): string {
  let t = normalizar(texto);
  for (const [re, rep] of SINONIMOS) t = t.replace(re, rep);
  return t.replace(/\s+/g, ' ').trim();
}

/** Palabras significativas de una denominación ya canonizada. */
export function terminos(texto: string | null | undefined): string[] {
  return canonizar(texto)
    .split(' ')
    .filter((p) => p && !VACIAS.has(p));
}

/** Coeficiente de Dice sobre palabras significativas (0..1). */
export function parecidoPalabras(a: string, b: string): number {
  const ta = new Set(terminos(a));
  const tb = new Set(terminos(b));
  if (!ta.size || !tb.size) return 0;
  let comunes = 0;
  for (const p of ta) if (tb.has(p)) comunes++;
  return (2 * comunes) / (ta.size + tb.size);
}

function trigramas(texto: string): Map<string, number> {
  const t = ` ${terminos(texto).join(' ')} `;
  const m = new Map<string, number>();
  for (let i = 0; i < t.length - 2; i++) {
    const g = t.slice(i, i + 3);
    m.set(g, (m.get(g) || 0) + 1);
  }
  return m;
}

/** Dice sobre trigramas de caracteres: tolera errores de digitación (0..1). */
export function parecidoCaracteres(a: string, b: string): number {
  const ga = trigramas(a);
  const gb = trigramas(b);
  let na = 0, nb = 0, comunes = 0;
  for (const v of ga.values()) na += v;
  for (const v of gb.values()) nb += v;
  if (!na || !nb) return 0;
  for (const [g, v] of ga) comunes += Math.min(v, gb.get(g) || 0);
  return (2 * comunes) / (na + nb);
}

/** Parecido combinado: el mayor entre palabras y caracteres, ponderado hacia las palabras. */
export function parecido(a: string, b: string): number {
  const p = parecidoPalabras(a, b);
  const c = parecidoCaracteres(a, b);
  return Math.max(p, 0.6 * p + 0.4 * c, c * 0.9);
}

/**
 * ¿La denominación exigida aparece completa dentro del título, como frase contigua?
 * Es la regla de «denominación con término adicional»: «Licenciatura en Matemáticas
 * y Física» contiene «Licenciatura en Matemáticas».
 */
export function contieneFrase(titulo: string, exigida: string): boolean {
  const t = ` ${terminos(titulo).join(' ')} `;
  const e = terminos(exigida).join(' ');
  return !!e && t.includes(` ${e} `);
}

/** ¿Todas las palabras significativas exigidas aparecen en el título, en cualquier orden? */
export function contieneTerminos(titulo: string, exigidos: string[]): boolean {
  const t = new Set(terminos(titulo));
  const req = exigidos.flatMap((e) => terminos(e));
  return req.length > 0 && req.every((p) => t.has(p));
}

/** Igualdad tras canonizar y quitar palabras vacías. */
export function igualDenominacion(a: string, b: string): boolean {
  const ta = terminos(a).join(' ');
  return !!ta && ta === terminos(b).join(' ');
}

/** Fecha ISO (AAAA-MM-DD) desde «15/12/2024», «2024-12-15», «15-12-2024» o número de serie de Excel. */
export function leerFecha(valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number' || /^\d{5}(\.\d+)?$/.test(String(valor).trim())) {
    const serie = Number(valor);
    if (serie > 20000 && serie < 80000) {
      const ms = Math.round((serie - 25569) * 86400000);
      return new Date(ms).toISOString().slice(0, 10);
    }
  }
  const s = String(valor).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return armar(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) return armar(+m[3], +m[2], +m[1]);
  return null;
}

function armar(a: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCMonth() !== m - 1) return null;
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** «sí», «si», «x», «1», «true» → true. */
export function leerBooleano(valor: unknown): boolean {
  const t = normalizar(String(valor ?? ''));
  return ['si', 's', 'x', '1', 'true', 'verdadero', 'yes'].includes(t);
}
