/**
 * Carga de aspirantes, procesamiento en lote y exportación del informe.
 *
 * Los aspirantes se individualizan por inscripción y OPEC, nunca por nombre ni
 * documento de identidad: la herramienta no los pide y el informe no los imprime.
 */
import type { Manual } from './manual';
import { verificarAspirante, RESULTADO_LEGIBLE, type Aspirante, type Dictamen, type Parametros } from './motor';
import { NOMBRE_NIVEL, type CatalogoSnies } from './snies';
import { columna, type Tabla } from './tabla';
import { leerBooleano, leerFecha } from './texto';
import { CATEGORIA_LEGIBLE, clasificarVA, type ParametrosVA, type ResultadoVA } from './va';

const ALIAS_ASPIRANTE = {
  inscripcion: ['inscripcion', 'numero de inscripcion', 'id inscripcion', 'carpeta'],
  opec: ['opec', 'numero opec', 'codigo opec'],
  empleoId: ['empleo id', 'empleo_id', 'id empleo', 'empleo', 'codigo empleo'],
  folio: ['folio', 'numero de folio', 'documento'],
  institucion: ['institucion', 'institucion educativa', 'nombre institucion', 'ies'],
  programa: ['programa', 'titulo', 'denominacion', 'denominacion del titulo', 'titulo obtenido'],
  codigoSnies: ['codigo snies', 'snies', 'codigo snies del programa'],
  nivel: ['nivel', 'nivel de formacion'],
  fechaGrado: ['fecha grado', 'fecha de grado', 'fecha_grado', 'fecha'],
  pais: ['pais', 'pais de obtencion'],
  convalidado: ['convalidado', 'convalidacion'],
  apostillado: ['apostillado', 'apostilla', 'legalizado'],
};

export interface ErrorCarga {
  fila: number;
  mensaje: string;
}

/** Una fila por título; las filas con la misma inscripción y empleo forman un aspirante. */
export function aspirantesDesdeTabla(t: Tabla): { aspirantes: Aspirante[]; errores: ErrorCarga[] } {
  const errores: ErrorCarga[] = [];
  const mapa = new Map<string, Aspirante>();
  t.filas.forEach((f, i) => {
    const n = i + 2;
    const get = (k: keyof typeof ALIAS_ASPIRANTE) => columna(f, ALIAS_ASPIRANTE[k]);
    const inscripcion = get('inscripcion');
    const empleoId = get('empleoId');
    const programa = get('programa');
    if (!inscripcion && !programa) return;
    if (!inscripcion) { errores.push({ fila: n, mensaje: 'Falta la inscripción.' }); return; }
    if (!empleoId) { errores.push({ fila: n, mensaje: `Inscripción ${inscripcion}: falta el empleo.` }); return; }
    const clave = `${inscripcion}\u0000${empleoId}`;
    let a = mapa.get(clave);
    if (!a) {
      a = { inscripcion, opec: get('opec'), empleoId, titulos: [] };
      mapa.set(clave, a);
    }
    if (!programa) return; // aspirante sin títulos: se dictamina igual
    const fechaTexto = get('fechaGrado');
    const fechaGrado = leerFecha(fechaTexto);
    if (fechaTexto && !fechaGrado) errores.push({ fila: n, mensaje: `Inscripción ${inscripcion}: fecha de grado ilegible («${fechaTexto}»).` });
    a.titulos.push({
      folio: get('folio'),
      institucion: get('institucion'),
      programa,
      codigoSnies: get('codigoSnies'),
      nivel: get('nivel'),
      fechaGrado,
      pais: get('pais'),
      convalidado: leerBooleano(get('convalidado')),
      apostillado: leerBooleano(get('apostillado')),
    });
  });
  return { aspirantes: [...mapa.values()], errores };
}

export interface ResultadoAspirante {
  dictamen: Dictamen;
  va: ResultadoVA;
}

export function procesarLote(
  aspirantes: Aspirante[],
  manual: Manual,
  snies: CatalogoSnies | null,
  p: Parametros,
  va: ParametrosVA | null,
): ResultadoAspirante[] {
  return aspirantes.map((a) => {
    const dictamen = verificarAspirante(a, manual, snies, p);
    return { dictamen, va: clasificarVA(dictamen, p.fechaCorte, va) };
  });
}

export interface Resumen {
  total: number;
  cumple: number;
  noCumple: number;
  revision: number;
}

export function resumir(rs: ResultadoAspirante[]): Resumen {
  const r = { total: rs.length, cumple: 0, noCumple: 0, revision: 0 };
  for (const x of rs) {
    if (x.dictamen.resultado === 'CUMPLE') r.cumple++;
    else if (x.dictamen.resultado === 'NO_CUMPLE') r.noCumple++;
    else r.revision++;
  }
  return r;
}

function celda(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  // Evita que Excel interprete una celda como fórmula.
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[";\n\r]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/** Una fila por título (y una por aspirante sin títulos). Separador «;» y BOM, para Excel en español. */
export function informeCsv(rs: ResultadoAspirante[]): string {
  const enc = [
    'Inscripción', 'OPEC', 'Empleo', 'Dictamen del aspirante', 'Motivo del dictamen',
    'Folio', 'Institución declarada', 'Denominación del diploma', 'Fecha de grado', 'País',
    'Código SNIES', 'Programa SNIES', 'Institución SNIES', 'Título otorgado SNIES', 'NBC', 'Nivel de formación',
    'Ubicación SNIES', 'Confianza SNIES', 'Resultado del título', 'Uso del título', 'Regla aplicada', 'Fuente de la regla',
    'Motivos', 'Alertas', 'Categoría VA', 'Relación con el empleo (VA)', 'Puntos VA', 'Puntaje VA proyectado', 'Observación sugerida',
  ];
  const filas: unknown[][] = [enc];
  for (const { dictamen: d, va } of rs) {
    const empleo = d.empleo ? [d.empleo.id, d.empleo.denominacion, d.empleo.area].filter(Boolean).join(' · ') : d.aspirante.empleoId;
    const base = [d.aspirante.inscripcion, d.aspirante.opec || '', empleo, RESULTADO_LEGIBLE[d.resultado], d.motivo];
    if (!d.titulos.length) {
      filas.push([...base, ...Array(enc.length - base.length - 1).fill(''), d.observacionSugerida]);
      continue;
    }
    for (const t of d.titulos) {
      const c = t.snies?.elegido?.programa;
      const cva = va.titulos.find((x) => x.indice === t.indice);
      const uso = t.indice === d.tituloRequisito ? (d.resultado === 'CUMPLE' ? 'Requisito mínimo' : 'Requisito mínimo (por confirmar)') : cva && cva.categoria !== 'NO_VALORABLE' ? 'Valoración de antecedentes' : 'Ninguno';
      filas.push([
        ...base,
        t.titulo.folio || '', t.titulo.institucion, t.titulo.programa, t.titulo.fechaGrado || '', t.titulo.pais || 'Colombia',
        c?.codigoSnies || '', c?.nombrePrograma || '', c?.nombreInstitucion || '', c?.tituloOtorgado || '', c?.nbc || '', NOMBRE_NIVEL[t.nivel],
        t.extranjero ? 'No aplica (exterior)' : t.snies ? { CODIGO: 'Por código SNIES', DENOMINACION: 'Por institución y denominación', NO_ENCONTRADO: 'No encontrado' }[t.snies.via] : 'No aplica',
        t.snies?.elegido ? `${Math.round(t.snies.elegido.confianza * 100)} %` : '',
        RESULTADO_LEGIBLE[t.resultado], uso,
        t.coincidencia ? `${t.coincidencia.regla.modo}: ${t.coincidencia.regla.valor}` : '', t.coincidencia?.regla.fuente || '',
        t.motivos.join(' '), t.alertas.join(' '),
        cva ? CATEGORIA_LEGIBLE[cva.categoria] : '', cva ? { PROBABLE: 'Probable — confirmar', POR_ESTABLECER: 'Por establecer', NO_APLICA: '' }[cva.relacion] : '',
        cva?.puntos ?? '', va.puntajeProyectado ?? '',
        t.indice === d.tituloRequisito || (d.tituloRequisito === null && t.indice === 0) ? d.observacionSugerida : '',
      ]);
    }
  }
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n') + '\r\n';
}
