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
  /**
   * Formato por tablas (Anexo Técnico docentes 2026): una tabla por tipo de empleo, con el
   * factor del requisito mínimo y dos factores de educación adicional (afín al cargo y otras
   * áreas), cada uno con su tope. Si está presente, reemplaza a `categorias` y `topeFactor`.
   */
  tablas?: TablaVA[];
}

/** Nivel del título adicional, como lo nombran las tablas de VA. */
export type NivelVA = 'PREGRADO' | 'ESPECIALIZACION' | 'MAESTRIA' | 'DOCTORADO';

export interface FactorVA {
  /** Nombre del factor tal como lo trae la tabla. */
  nombre: string;
  maximo: number;
  /** Puntos por título, por nivel. Un nivel ausente no puntúa en este factor. */
  puntos: Partial<Record<NivelVA, number>>;
}

export interface TablaVA {
  /** Ej.: «Tabla de Valoración para Docentes de Aula». */
  nombre: string;
  numeral: string;
  /** empleo_id del manual; «PREFIJO*» alcanza a todos los que empiezan así. */
  empleos: string[];
  /** Factor 1: puntos del título que acreditó el requisito mínimo. */
  requisitoMinimo: number;
  /** Factor 2: educación formal adicional afín al cargo. */
  afin: FactorVA;
  /** Factor 3: educación formal adicional en otras áreas. */
  otras: FactorVA;
  /**
   * Qué pregrado adicional puede ir al factor afín: «LICENCIATURA» (solo licenciaturas) o
   * «AFIN» (cualquiera con relación probable, como en la tabla del orientador).
   */
  pregradoAfin: 'LICENCIATURA' | 'AFIN';
  /** Raíces adicionales que hacen probable la afinidad (p. ej. «psicolog» para el orientador). */
  raicesAfines?: string[];
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
      const motivo = d.resultado === 'CUMPLE'
        ? 'Acredita el requisito mínimo; se valora en su propia categoría y no como educación adicional.'
        : 'Candidato al requisito mínimo: su categoría se confirma con la revisión humana del dictamen.';
      return { indice: r.indice, categoria: 'REQUISITO_MINIMO', relacion: 'NO_APLICA', motivo, puntos: null };
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
  if (params.tablas) return puntuarPorTablas(d, titulos, params, advertencias);

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

const NIVEL_VA: Partial<Record<CategoriaVA, NivelVA>> = {
  PREGRADO_ADICIONAL: 'PREGRADO', ESPECIALIZACION: 'ESPECIALIZACION', MAESTRIA: 'MAESTRIA', DOCTORADO: 'DOCTORADO',
};

/** Tabla de VA del empleo: primero por empleo_id exacto, luego por prefijo («DOC-*»). */
export function tablaDelEmpleo(tablas: TablaVA[], empleoId: string): TablaVA | null {
  return tablas.find((t) => t.empleos.includes(empleoId))
    || tablas.find((t) => t.empleos.some((e) => e.endsWith('*') && empleoId.startsWith(e.slice(0, -1))))
    || null;
}

function textosVA(r: ResultadoTitulo): string {
  return normalizar([r.titulo.programa, r.snies?.elegido?.programa.nombrePrograma || '', r.snies?.elegido?.programa.campoAmplio || ''].join(' '));
}

function esLicenciatura(r: ResultadoTitulo): boolean {
  const nombres = [r.titulo.programa, r.snies?.elegido?.programa.nombrePrograma || ''];
  return nombres.some((n) => terminos(n)[0] === 'licenciatura') || normalizar(r.snies?.elegido?.programa.nbc) === 'educacion';
}

/**
 * Puntaje por tablas: factor 1 (requisito mínimo), factor 2 (adicional afín al cargo) y
 * factor 3 (adicional en otras áreas), cada uno con su tope. Un título adicional va al factor 2
 * solo si su afinidad es probable (educación o pedagogía, o las raíces propias de la tabla); si
 * no, se proyecta en el factor 3 y el analista decide si pasa al 2.
 */
function puntuarPorTablas(d: Dictamen, titulos: ClasificacionVA[], params: ParametrosVA, advertencias: string[]): ResultadoVA {
  const tabla = d.empleo ? tablaDelEmpleo(params.tablas!, d.empleo.id) : null;
  if (!tabla) {
    return {
      titulos,
      puntajeProyectado: null,
      fuente: params.fuente,
      advertencias: [...advertencias, `Los parámetros de VA no tienen tabla para el empleo «${d.empleo?.id || 'sin empleo'}»: se clasifica, pero no se puntúa.`],
    };
  }
  const usado = { afin: 0, otras: 0 };
  let requisito = 0;
  for (const c of titulos) {
    const r = d.titulos.find((x) => x.indice === c.indice);
    if (!r || c.categoria === 'NO_VALORABLE') continue;
    if (c.categoria === 'REQUISITO_MINIMO') {
      if (d.resultado === 'CUMPLE') {
        c.puntos = tabla.requisitoMinimo;
        requisito = tabla.requisitoMinimo;
        c.motivo += ` Factor 1 (${tabla.numeral}).`;
      } else {
        c.motivo += ` Factor 1 (${tabla.numeral}): ${tabla.requisitoMinimo} puntos si se confirma el requisito.`;
      }
      continue;
    }
    const nivel = NIVEL_VA[c.categoria];
    if (!nivel) {
      c.puntos = 0;
      c.motivo = `${tabla.nombre} (${tabla.numeral}): este nivel de formación no puntúa como educación adicional.`;
      continue;
    }
    const plano = textosVA(r);
    const afinProbable = RAICES_EDUCACION.some((x) => plano.includes(x)) || (tabla.raicesAfines || []).some((x) => plano.includes(normalizar(x)));
    const vaAlAfin = afinProbable && (nivel !== 'PREGRADO' || tabla.pregradoAfin === 'AFIN' || esLicenciatura(r));
    const factor = vaAlAfin ? tabla.afin : tabla.otras;
    const clave = vaAlAfin ? 'afin' : 'otras';
    const base = factor.puntos[nivel] ?? 0;
    const p = Math.max(0, Math.min(base, factor.maximo - usado[clave]));
    usado[clave] += p;
    c.puntos = p;
    c.relacion = vaAlAfin ? 'PROBABLE' : 'POR_ESTABLECER';
    const tope = p < base ? ` Se alcanzó el tope del factor (${factor.maximo}).` : '';
    if (vaAlAfin) {
      c.motivo = `Factor «${factor.nombre}» (${tabla.numeral}): ${base} puntos.${tope} La afinidad con el cargo es probable; la confirma el analista.`;
    } else {
      const alterno = tabla.afin.puntos[nivel];
      c.motivo = `Se proyecta en el factor «${factor.nombre}» (${tabla.numeral}): ${base} puntos.${tope}`
        + (alterno !== undefined && (nivel !== 'PREGRADO' || tabla.pregradoAfin === 'AFIN')
          ? ` Si el analista establece que es ${tabla.pregradoAfin === 'AFIN' ? 'afín al cargo' : 'de ciencias de la educación afín al cargo'}, pasa al factor «${tabla.afin.nombre}» (${alterno} puntos).`
          : '');
    }
  }
  const total = requisito + usado.afin + usado.otras;
  return {
    titulos,
    puntajeProyectado: total,
    fuente: `${params.fuente} — ${tabla.nombre} (${tabla.numeral})`,
    advertencias: [
      ...advertencias,
      'El puntaje proyectado cubre solo la educación formal (factores 1 a 3). Saber Pro, segunda lengua, formación continua y experiencia no los calcula el verificador.',
    ],
  };
}

function leerFactor(v: any, donde: string): FactorVA {
  if (!v || typeof v !== 'object' || !Number.isFinite(Number(v.maximo)) || typeof v.puntos !== 'object') {
    throw new Error(`${donde}: el factor necesita «nombre», «maximo» y «puntos».`);
  }
  const puntos: FactorVA['puntos'] = {};
  for (const [k, n] of Object.entries(v.puntos as Record<string, unknown>)) {
    if (!['PREGRADO', 'ESPECIALIZACION', 'MAESTRIA', 'DOCTORADO'].includes(k)) throw new Error(`${donde}: nivel «${k}» desconocido.`);
    if (!Number.isFinite(Number(n))) throw new Error(`${donde}: los puntos de «${k}» deben ser numéricos.`);
    puntos[k as NivelVA] = Number(n);
  }
  return { nombre: String(v.nombre || ''), maximo: Number(v.maximo), puntos };
}

function leerTablas(lista: unknown): TablaVA[] {
  if (!Array.isArray(lista) || !lista.length) throw new Error('«tablas» debe ser una lista con al menos una tabla.');
  return lista.map((t: any, i) => {
    const donde = `Tabla ${i + 1}${t?.nombre ? ` («${t.nombre}»)` : ''}`;
    if (!Array.isArray(t?.empleos) || !t.empleos.length) throw new Error(`${donde}: falta la lista «empleos».`);
    if (!Number.isFinite(Number(t.requisitoMinimo))) throw new Error(`${donde}: falta «requisitoMinimo» numérico.`);
    return {
      nombre: String(t.nombre || ''),
      numeral: String(t.numeral || ''),
      empleos: t.empleos.map(String),
      requisitoMinimo: Number(t.requisitoMinimo),
      afin: leerFactor(t.afin, `${donde}, factor afín`),
      otras: leerFactor(t.otras, `${donde}, factor de otras áreas`),
      pregradoAfin: t.pregradoAfin === 'AFIN' ? 'AFIN' : 'LICENCIATURA',
      raicesAfines: Array.isArray(t.raicesAfines) ? t.raicesAfines.map(String) : undefined,
    };
  });
}

export function leerParametrosVA(texto: string): ParametrosVA {
  const j = JSON.parse(texto);
  if (j && typeof j === 'object' && 'tablas' in j) {
    const tablas = leerTablas(j.tablas);
    const tope = Math.max(...tablas.map((t) => t.requisitoMinimo + t.afin.maximo + t.otras.maximo));
    return { fuente: String(j.fuente || ''), categorias: {}, topeFactor: tope, exigeRelacion: true, tablas };
  }
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
