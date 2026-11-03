/**
 * Clasificación de los títulos para la Valoración de Antecedentes (VA).
 *
 * Se apoya en el dictamen de requisitos: el título que acreditó el requisito mínimo se
 * valora en su propia categoría (numeral 2 del artículo 2.4.1.1.13 del Decreto 1075 de
 * 2015) y no vuelve a contarse como educación adicional. Los demás se clasifican por
 * nivel y se marca la relación probable con el empleo.
 *
 * Los puntajes NO están en el código: salen de un archivo de parámetros con la tabla
 * del Anexo Técnico vigente del proceso. Sin ese archivo, la herramienta clasifica pero
 * no puntúa. La relación con el empleo siempre la confirma el analista.
 */
import type { Empleo } from './manual';
import type { Dictamen, ResultadoTitulo } from './motor';
import { NOMBRE_NIVEL, type Nivel } from './snies';
import { normalizar, terminos } from './texto';

export type CategoriaVA =
  | 'REQUISITO_MINIMO'
  | 'PREGRADO_ADICIONAL'
  | 'NORMALISTA'
  | 'TECNICA_TECNOLOGICA'
  | 'ESPECIALIZACION'
  | 'MAESTRIA'
  | 'DOCTORADO'
  | 'NO_VALORABLE';

export const CATEGORIA_LEGIBLE: Record<CategoriaVA, string> = {
  REQUISITO_MINIMO: 'Título del requisito mínimo',
  PREGRADO_ADICIONAL: 'Pregrado adicional',
  NORMALISTA: 'Normalista superior adicional',
  TECNICA_TECNOLOGICA: 'Técnico profesional o tecnólogo',
  ESPECIALIZACION: 'Especialización',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
  NO_VALORABLE: 'No valorable',
};

export interface ParametrosVA {
  /** Ej.: «Anexo Técnico, numeral X — Acuerdo CNSC NNN de 2026». Se imprime en el informe. */
  fuente: string;
  categorias: Partial<Record<CategoriaVA, { puntosPorTitulo: number; maximo: number }>>;
  /** Tope del factor de educación formal. */
  topeFactor: number;
  /** Si es true, solo puntúan los títulos adicionales con relación confirmada o probable. */
  exigeRelacion: boolean;
}

export type Relacion = 'PROBABLE' | 'POR_ESTABLECER' | 'NO_APLICA';

export interface ClasificacionVA {
  indice: number;
  categoria: CategoriaVA;
  relacion: Relacion;
  motivo: string;
  puntos: number | null;
}

export interface ResultadoVA {
  titulos: ClasificacionVA[];
  /** null si no se cargaron parámetros. */
  puntajeProyectado: number | null;
  fuente: string;
  advertencias: string[];
}

/** Palabras que indican formación en educación o pedagogía. */
const RAICES_EDUCACION = ['educacion', 'pedagog', 'didactic', 'docencia', 'ensenanza', 'curricul', 'licenciatura', 'orientacion escolar', 'gestion educativa', 'evaluacion educativa', 'educativ'];

function categoria(nivel: Nivel): CategoriaVA {
  switch (nivel) {
    case 'UNIVERSITARIA': return 'PREGRADO_ADICIONAL';
    case 'NORMALISTA': return 'NORMALISTA';
    case 'TECNICA_PROFESIONAL':
    case 'TECNOLOGICA': return 'TECNICA_TECNOLOGICA';
    case 'ESPECIALIZACION': return 'ESPECIALIZACION';
    case 'MAESTRIA': return 'MAESTRIA';
    case 'DOCTORADO': return 'DOCTORADO';
    default: return 'NO_VALORABLE';
  }
}

function relacionProbable(r: ResultadoTitulo, empleo: Empleo | null): { relacion: Relacion; motivo: string } {
  const textos = [r.titulo.programa, r.snies?.elegido?.programa.nombrePrograma || '', r.snies?.elegido?.programa.campoAmplio || ''];
  const plano = normalizar(textos.join(' '));
  if (RAICES_EDUCACION.some((x) => plano.includes(x))) {
    return { relacion: 'PROBABLE', motivo: 'La denominación se refiere a educación o pedagogía.' };
  }
  const area = empleo ? terminos(empleo.area).filter((p) => p.length > 3) : [];
  const propios = new Set(terminos(textos.join(' ')));
  const comunes = area.filter((p) => propios.has(p));
  if (comunes.length) {
    return { relacion: 'PROBABLE', motivo: `La denominación comparte términos con el área del empleo (${comunes.join(', ')}).` };
  }
  return { relacion: 'POR_ESTABLECER', motivo: 'La relación con el propósito y las funciones del empleo debe establecerla el analista.' };
}

export function clasificarVA(d: Dictamen, fechaCorte: string | null, params: ParametrosVA | null): ResultadoVA {
  const advertencias: string[] = [];
  const titulos: ClasificacionVA[] = d.titulos.map((r) => {
    if (r.dentroDelCorte === false) {
      return { indice: r.indice, categoria: 'NO_VALORABLE', relacion: 'NO_APLICA', motivo: `Obtenido después del cierre de inscripciones (${fechaCorte}).`, puntos: null };
    }
    if (r.extranjero && !r.titulo.convalidado) {
      return { indice: r.indice, categoria: 'NO_VALORABLE', relacion: 'NO_APLICA', motivo: 'Título del exterior sin convalidación: en Valoración de Antecedentes solo se puntúan títulos convalidados (Criterio Unificado CNSC del 4 de junio de 2024).', puntos: null };
    }
    if (r.indice === d.tituloRequisito) {
      return { indice: r.indice, categoria: 'REQUISITO_MINIMO', relacion: 'NO_APLICA', motivo: 'Acredita el requisito mínimo; se valora en su propia categoría y no como educación adicional.', puntos: null };
    }
    if (r.dentroDelCorte === null && fechaCorte) {
      advertencias.push(`El título «${r.titulo.programa}» no tiene fecha de grado: confirme que sea anterior al cierre antes de puntuarlo.`);
    }
    const cat = categoria(r.nivel);
    if (cat === 'NO_VALORABLE') {
      return { indice: r.indice, categoria: cat, relacion: 'NO_APLICA', motivo: `No se pudo establecer el nivel de formación (${NOMBRE_NIVEL[r.nivel]}).`, puntos: null };
    }
    const rel = relacionProbable(r, d.empleo);
    return { indice: r.indice, categoria: cat, relacion: rel.relacion, motivo: rel.motivo, puntos: null };
  });

  if (!params) {
    return { titulos, puntajeProyectado: null, fuente: '', advertencias: [...advertencias, 'Sin parámetros de VA cargados: se clasifica, pero no se puntúa.'] };
  }

  const usados: Partial<Record<CategoriaVA, number>> = {};
  let total = 0;
  for (const c of titulos) {
    const conf = params.categorias[c.categoria];
    if (!conf || c.categoria === 'NO_VALORABLE') continue;
    if (params.exigeRelacion && c.categoria !== 'REQUISITO_MINIMO' && c.relacion === 'POR_ESTABLECER') {
      c.motivo += ' No se puntúa hasta que el analista confirme la relación.';
      c.puntos = 0;
      continue;
    }
    const ya = usados[c.categoria] || 0;
    const p = Math.max(0, Math.min(conf.puntosPorTitulo, conf.maximo - ya));
    usados[c.categoria] = ya + p;
    c.puntos = p;
    total += p;
  }
  const proyectado = Math.min(total, params.topeFactor);
  if (total > params.topeFactor) advertencias.push(`La suma (${total}) supera el tope del factor (${params.topeFactor}); se proyecta el tope.`);
  return { titulos, puntajeProyectado: Math.round(proyectado * 100) / 100, fuente: params.fuente, advertencias };
}

export function leerParametrosVA(texto: string): ParametrosVA {
  const j = JSON.parse(texto);
  if (!j || typeof j !== 'object' || typeof j.categorias !== 'object') {
    throw new Error('El archivo de parámetros de VA debe tener un objeto «categorias».');
  }
  const categorias: ParametrosVA['categorias'] = {};
  for (const [k, v] of Object.entries(j.categorias as Record<string, any>)) {
    if (!(k in CATEGORIA_LEGIBLE)) throw new Error(`Categoría de VA desconocida: «${k}».`);
    if (v === null) continue;
    const puntos = Number(v.puntosPorTitulo);
    const maximo = Number(v.maximo);
    if (!Number.isFinite(puntos) || !Number.isFinite(maximo)) {
      throw new Error(`La categoría «${k}» necesita «puntosPorTitulo» y «maximo» numéricos (o null si no puntúa).`);
    }
    categorias[k as CategoriaVA] = { puntosPorTitulo: puntos, maximo };
  }
  const tope = Number(j.topeFactor);
  if (!Number.isFinite(tope)) throw new Error('Falta «topeFactor» numérico en los parámetros de VA.');
  return { fuente: String(j.fuente || ''), categorias, topeFactor: tope, exigeRelacion: j.exigeRelacion !== false };
}
