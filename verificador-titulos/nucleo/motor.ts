/**
 * Motor de verificación: título declarado → SNIES → Manual de Funciones → dictamen.
 *
 * Es determinista: las mismas entradas dan el mismo resultado, y cada decisión lleva
 * la regla del manual y la fuente que la sustentan. Cuando la evidencia no basta para
 * decidir con seguridad, el resultado es REVISIÓN HUMANA, nunca un «no cumple»
 * adivinado. El dictamen es un insumo para el analista, no la decisión de la VRM.
 */
import { buscarEmpleo, MODO_LEGIBLE, type Empleo, type Manual, type Regla } from './manual';
import {
  clasificarNivel,
  ES_POSGRADO,
  nivelPorDenominacion,
  NOMBRE_NIVEL,
  type CatalogoSnies,
  type CandidatoSnies,
  type Nivel,
  type ResolucionSnies,
} from './snies';
import { canonizar, contieneFrase, contieneTerminos, igualDenominacion, normalizar, parecido } from './texto';

export interface TituloDeclarado {
  folio?: string;
  institucion: string;
  /** Denominación tal como figura en el diploma o el acta de grado. */
  programa: string;
  codigoSnies?: string;
  /** Nivel declarado (opcional): se usa solo si el SNIES no lo resuelve. */
  nivel?: string;
  /** AAAA-MM-DD */
  fechaGrado?: string | null;
  /** Vacío o «Colombia» para títulos nacionales. */
  pais?: string;
  /** Títulos del exterior: resolución de convalidación del MEN. */
  convalidado?: boolean;
  /** Títulos del exterior: apostilla o legalización, y traducción oficial si aplica. */
  apostillado?: boolean;
}

export interface Aspirante {
  inscripcion: string;
  opec?: string;
  empleoId: string;
  titulos: TituloDeclarado[];
}

export interface Parametros {
  /** Último día de inscripciones de la etapa (AAAA-MM-DD). Títulos posteriores no se valoran. */
  fechaCorte: string | null;
  /** Por debajo de esta confianza, una resolución SNIES por denominación va a revisión. */
  confianzaMinima?: number;
}

export type Resultado = 'CUMPLE' | 'NO_CUMPLE' | 'REVISION';

export const RESULTADO_LEGIBLE: Record<Resultado, string> = {
  CUMPLE: 'Cumple',
  NO_CUMPLE: 'No cumple',
  REVISION: 'Revisión humana',
};

export interface Coincidencia {
  regla: Regla;
  /** Qué texto coincidió: «diploma», «programa SNIES» o «título otorgado SNIES». */
  texto: string;
  /** El texto mismo, cuando la coincidencia es por denominación. */
  contenido?: string;
}

export interface ResultadoTitulo {
  indice: number;
  titulo: TituloDeclarado;
  extranjero: boolean;
  snies: ResolucionSnies | null;
  nivel: Nivel;
  /** Resultado del título frente al requisito de formación del empleo. */
  resultado: Resultado;
  coincidencia: Coincidencia | null;
  motivos: string[];
  alertas: string[];
  /** false si el título es posterior al corte o le falta la fecha. */
  dentroDelCorte: boolean | null;
}

export interface Dictamen {
  aspirante: Aspirante;
  empleo: Empleo | null;
  resultado: Resultado;
  /** Índice (en `titulos`) del título que acredita el requisito mínimo, si lo hay. */
  tituloRequisito: number | null;
  titulos: ResultadoTitulo[];
  motivo: string;
  /** Texto de apoyo. La observación que se registra en SIMO se toma del catálogo autorizado. */
  observacionSugerida: string;
}

const PRIORIDAD_MODO: Record<string, number> = {
  EXACTA: 7, NORMALISTA: 6, CONTIENE: 5, TERMINOS: 4, NBC: 3, CAMPO: 2, NIVEL: 1, EXCLUYE: 0,
};

function esExtranjero(pais?: string): boolean {
  const p = normalizar(pais);
  return !!p && !['colombia', 'co', 'col'].includes(p);
}

/** Textos del título contra los que se coteja el manual. */
function textosDelTitulo(t: TituloDeclarado, c: CandidatoSnies | null): Array<[string, string]> {
  const textos: Array<[string, string]> = [['diploma', t.programa]];
  if (c?.programa.nombrePrograma) textos.push(['programa SNIES', c.programa.nombrePrograma]);
  if (c?.programa.tituloOtorgado) textos.push(['título otorgado SNIES', c.programa.tituloOtorgado]);
  return textos;
}

function cumpleModo(regla: Regla, texto: string): boolean {
  switch (regla.modo) {
    case 'EXACTA': return igualDenominacion(texto, regla.valor);
    case 'CONTIENE':
    case 'EXCLUYE': return contieneFrase(texto, regla.valor);
    case 'TERMINOS': return contieneTerminos(texto, regla.valor.split('+'));
    default: return false;
  }
}

function coincideClasificacion(valorRegla: string, valorSnies: string): boolean {
  if (!valorSnies) return false;
  const a = canonizar(valorRegla);
  const b = canonizar(valorSnies);
  return a === b || parecido(a, b) >= 0.92;
}

/** Reglas del empleo que el título satisface, sin considerar exclusiones. */
function coincidencias(empleo: Empleo, t: TituloDeclarado, c: CandidatoSnies | null, nivel: Nivel): Coincidencia[] {
  const out: Coincidencia[] = [];
  const textos = textosDelTitulo(t, c);
  for (const r of empleo.reglas) {
    if (r.estado === 'INACTIVA' || r.modo === 'EXCLUYE') continue;
    if (r.modo === 'NIVEL') {
      const nivelRegla = clasificarNivel(r.valor);
      if (nivel !== 'DESCONOCIDO' && nivel === nivelRegla) out.push({ regla: r, texto: c ? 'nivel SNIES' : 'nivel declarado' });
      continue;
    }
    if (r.modo === 'NORMALISTA') {
      if (nivel === 'NORMALISTA') out.push({ regla: r, texto: 'diploma' });
      continue;
    }
    if (!r.niveles.includes(nivel) && nivel !== 'DESCONOCIDO') continue;
    if (r.modo === 'NBC' || r.modo === 'CAMPO') {
      if (!c) continue;
      const p = c.programa;
      const ok = r.modo === 'NBC'
        ? coincideClasificacion(r.valor, p.nbc)
        : [p.campoAmplio, p.campoEspecifico, p.campoDetallado].some((v) => coincideClasificacion(r.valor, v));
      if (ok) out.push({ regla: r, texto: r.modo === 'NBC' ? 'NBC SNIES' : 'campo CINE SNIES' });
      continue;
    }
    for (const [etiqueta, texto] of textos) {
      if (!texto || !cumpleModo(r, texto)) continue;
      if (r.excluye.some((x) => textos.some(([, tx]) => contieneFrase(tx, x)))) continue;
      out.push({ regla: r, texto: etiqueta, contenido: texto });
      break;
    }
  }
  return out.sort((a, b) => PRIORIDAD_MODO[b.regla.modo] - PRIORIDAD_MODO[a.regla.modo]);
}

/** Regla de exclusión del empleo que alcanza al título, si la hay. */
function exclusion(empleo: Empleo, t: TituloDeclarado, c: CandidatoSnies | null): Regla | null {
  for (const r of empleo.reglas) {
    if (r.modo !== 'EXCLUYE' || r.estado === 'INACTIVA') continue;
    if (textosDelTitulo(t, c).some(([, tx]) => tx && contieneFrase(tx, r.valor))) return r;
  }
  return null;
}

interface Evaluacion {
  resultado: Resultado;
  coincidencia: Coincidencia | null;
  motivos: string[];
}

function evaluarContraEmpleo(empleo: Empleo, t: TituloDeclarado, c: CandidatoSnies | null, nivel: Nivel): Evaluacion {
  const motivos: string[] = [];
  const lista = coincidencias(empleo, t, c, nivel);
  const mejor = lista[0] || null;
  const excl = exclusion(empleo, t, c);
  if (excl && (!mejor || mejor.regla.modo !== 'EXACTA')) {
    motivos.push(`La denominación está excluida para este empleo: «${excl.valor}» (${excl.fuente || 'sin fuente'}).`);
    if (excl.nota) motivos.push(excl.nota);
    return { resultado: excl.estado === 'REVISAR' ? 'REVISION' : 'NO_CUMPLE', coincidencia: null, motivos };
  }
  if (!mejor) {
    if (ES_POSGRADO[nivel]) {
      motivos.push(`Es un título de ${NOMBRE_NIVEL[nivel].toLowerCase()}: un posgrado no suple el título de pregrado exigido, porque no permite establecer si el pregrado corresponde a lo que pide el manual.`);
    } else if (nivel === 'TECNICA_PROFESIONAL' || nivel === 'TECNOLOGICA') {
      motivos.push(`El título es de nivel ${NOMBRE_NIVEL[nivel].toLowerCase()} y el manual no lo admite para este empleo.`);
    } else {
      motivos.push('La denominación del título no corresponde a ninguna de las admitidas por el manual para este empleo.');
    }
    return { resultado: 'NO_CUMPLE', coincidencia: null, motivos };
  }
  const r = mejor.regla;
  const identica = r.modo === 'CONTIENE' && !!mejor.contenido && igualDenominacion(mejor.contenido, r.valor);
  motivos.push(
    `Coincide por ${identica ? MODO_LEGIBLE.EXACTA : MODO_LEGIBLE[r.modo]} («${r.valor}») sobre el ${mejor.texto}`
    + `${r.fuente ? ` — ${r.fuente}` : ''}.`,
  );
  if (r.nota) motivos.push(r.nota);
  if (r.estado === 'REVISAR') {
    motivos.push('La regla del manual está marcada para revisión: su aplicación requiere decisión del analista.');
    return { resultado: 'REVISION', coincidencia: mejor, motivos };
  }
  return { resultado: 'CUMPLE', coincidencia: mejor, motivos };
}

export function evaluarTitulo(
  empleo: Empleo,
  t: TituloDeclarado,
  indice: number,
  snies: CatalogoSnies | null,
  p: Parametros,
): ResultadoTitulo {
  const alertas: string[] = [];
  const motivos: string[] = [];
  const extranjero = esExtranjero(t.pais);
  const fecha = t.fechaGrado || null;
  let dentroDelCorte: boolean | null = null;
  if (p.fechaCorte) {
    if (!fecha) alertas.push('El título no tiene fecha de grado: no puede verificarse que sea anterior al cierre de inscripciones.');
    else dentroDelCorte = fecha <= p.fechaCorte;
  }

  const nivelDeclarado = clasificarNivel(t.nivel || '');
  const nivelDenominacion = nivelPorDenominacion(t.programa);
  const esNormalista = nivelDeclarado === 'NORMALISTA' || nivelDenominacion === 'NORMALISTA';

  let resolucion: ResolucionSnies | null = null;
  let nivel: Nivel = nivelDeclarado !== 'DESCONOCIDO' ? nivelDeclarado : nivelDenominacion;

  if (extranjero) {
    alertas.push('Título obtenido en el exterior: el SNIES no lo registra.');
  } else if (esNormalista) {
    nivel = 'NORMALISTA';
    motivos.push('El título de normalista superior lo expide una Escuela Normal Superior y no figura en el SNIES; se verifica con el documento.');
  } else if (snies) {
    resolucion = snies.resolver({ codigoSnies: t.codigoSnies, institucion: t.institucion, programa: t.programa });
    alertas.push(...resolucion.alertas);
    const el = resolucion.elegido;
    if (el) {
      const n = clasificarNivel(el.programa.nivelFormacion);
      if (n !== 'DESCONOCIDO') {
        if (nivel !== 'DESCONOCIDO' && nivel !== n) {
          alertas.push(`El nivel declarado (${NOMBRE_NIVEL[nivel]}) difiere del registrado en el SNIES (${NOMBRE_NIVEL[n]}); prevalece el SNIES.`);
        }
        nivel = n;
      }
      if (/inactiv/i.test(el.programa.estado)) {
        alertas.push('El programa figura inactivo en el SNIES. No impide la validez de títulos otorgados mientras tuvo registro; verifique la fecha de grado.');
      }
    }
  }

  const candidato = resolucion?.elegido || null;
  const ev = evaluarContraEmpleo(empleo, t, candidato, nivel);
  let resultado = ev.resultado;
  motivos.push(...ev.motivos);

  // Ambigüedad: si otro candidato SNIES plausible lleva a un resultado distinto, decide una persona.
  if (resolucion?.alternativos.length) {
    const distintos = resolucion.alternativos.filter((alt) => {
      const n = clasificarNivel(alt.programa.nivelFormacion);
      return evaluarContraEmpleo(empleo, t, alt, n === 'DESCONOCIDO' ? nivel : n).resultado !== resultado;
    });
    if (distintos.length) {
      resultado = 'REVISION';
      motivos.push(
        'El SNIES tiene más de un programa plausible para esta denominación y llevan a resultados distintos: '
        + distintos.map((d) => `«${d.programa.nombrePrograma}» (SNIES ${d.programa.codigoSnies || 's/c'}, NBC ${d.programa.nbc || 's/d'})`).join('; ')
        + '. Identifique el programa con el código SNIES del diploma o con la certificación de la institución.',
      );
    }
  }

  if (resultado === 'CUMPLE' && !extranjero && !esNormalista) {
    if (!snies) {
      resultado = 'REVISION';
      motivos.push('No se cargó el SNIES: la coincidencia es solo por la denominación del diploma.');
    } else if (!candidato) {
      resultado = 'REVISION';
      motivos.push('Cumpliría por la denominación del diploma, pero el programa no se ubicó en el SNIES. Verifique institución y código.');
    } else if (resolucion?.via === 'DENOMINACION' && candidato.confianza < (p.confianzaMinima ?? 0.72)) {
      resultado = 'REVISION';
      motivos.push(`La ubicación del programa en el SNIES tiene confianza baja (${Math.round(candidato.confianza * 100)} %). Confirme el programa.`);
    }
  }

  if (extranjero && resultado !== 'NO_CUMPLE') {
    resultado = 'REVISION';
    motivos.push(
      'Criterio Unificado CNSC del 4 de junio de 2024: en VRM, el título de educación superior del exterior '
      + 'apostillado o legalizado, y traducido cuando aplica, no exige convalidación; en Valoración de Antecedentes '
      + 'solo se puntúa si está convalidado. Verifique la apostilla y la denominación.',
    );
    if (!t.apostillado && !t.convalidado) alertas.push('No se indicó apostilla, legalización ni convalidación.');
  }

  if (dentroDelCorte === false) {
    resultado = 'NO_CUMPLE';
    motivos.unshift(`El título se obtuvo el ${fecha}, después del cierre de inscripciones (${p.fechaCorte}): no se tiene en cuenta.`);
  } else if (p.fechaCorte && !fecha && resultado === 'CUMPLE') {
    resultado = 'REVISION';
  }

  return {
    indice,
    titulo: t,
    extranjero,
    snies: resolucion,
    nivel,
    resultado,
    coincidencia: ev.coincidencia,
    motivos,
    alertas,
    dentroDelCorte,
  };
}

const ORDEN_RESULTADO: Record<Resultado, number> = { CUMPLE: 2, REVISION: 1, NO_CUMPLE: 0 };

/** Elige, entre los títulos que cumplen, el de evidencia más fuerte. */
function mejorTitulo(rs: ResultadoTitulo[]): ResultadoTitulo | null {
  const orden = [...rs].sort((a, b) => {
    const r = ORDEN_RESULTADO[b.resultado] - ORDEN_RESULTADO[a.resultado];
    if (r) return r;
    const m = (PRIORIDAD_MODO[b.coincidencia?.regla.modo || 'EXCLUYE'] || 0) - (PRIORIDAD_MODO[a.coincidencia?.regla.modo || 'EXCLUYE'] || 0);
    if (m) return m;
    const v = (b.snies?.via === 'CODIGO' ? 1 : 0) - (a.snies?.via === 'CODIGO' ? 1 : 0);
    if (v) return v;
    return (a.titulo.fechaGrado || '9999').localeCompare(b.titulo.fechaGrado || '9999');
  });
  return orden[0] || null;
}

export function verificarAspirante(
  a: Aspirante,
  manual: Manual,
  snies: CatalogoSnies | null,
  p: Parametros,
): Dictamen {
  const empleo = buscarEmpleo(manual, a.empleoId) || null;
  if (!empleo) {
    return {
      aspirante: a,
      empleo: null,
      resultado: 'REVISION',
      tituloRequisito: null,
      titulos: [],
      motivo: `El empleo «${a.empleoId}» no está en el manual cargado. Revise el identificador del empleo o complete el manual.`,
      observacionSugerida: '',
    };
  }
  if (!a.titulos.length) {
    return {
      aspirante: a,
      empleo,
      resultado: 'NO_CUMPLE',
      tituloRequisito: null,
      titulos: [],
      motivo: 'No se aportó ningún título.',
      observacionSugerida: 'No se aportó documento que acredite el requisito de formación académica exigido para el empleo.',
    };
  }
  const titulos = a.titulos.map((t, i) => evaluarTitulo(empleo, t, i, snies, p));
  const mejor = mejorTitulo(titulos)!;
  const nombreEmpleo = [empleo.denominacion, empleo.area].filter(Boolean).join(' — ');
  let motivo: string;
  let observacion: string;
  if (mejor.resultado === 'CUMPLE') {
    motivo = `Acredita el requisito de formación con «${mejor.titulo.programa}» (${mejor.titulo.institucion || 'institución no indicada'}).`;
    observacion = `Cumple el requisito de formación académica del empleo ${nombreEmpleo} con el título «${mejor.titulo.programa}». ${mejor.motivos[0] || ''}`.trim();
  } else if (mejor.resultado === 'REVISION') {
    motivo = `Ningún título cumple con certeza; «${mejor.titulo.programa}» requiere revisión humana.`;
    observacion = '';
  } else {
    motivo = 'Ningún título aportado corresponde a los admitidos por el manual para el empleo.';
    observacion = `Los títulos aportados no corresponden a la formación académica exigida para el empleo ${nombreEmpleo} en el Manual de Funciones, Requisitos y Competencias.`;
  }
  return {
    aspirante: a,
    empleo,
    resultado: mejor.resultado,
    tituloRequisito: mejor.resultado === 'NO_CUMPLE' ? null : mejor.indice,
    titulos,
    motivo,
    observacionSugerida: observacion,
  };
}
