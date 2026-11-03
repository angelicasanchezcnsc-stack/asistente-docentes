/**
 * Catálogo de programas del SNIES y resolución de un título contra él.
 *
 * El SNIES certifica que un programa existe, quién lo ofrece, qué título otorga, en
 * qué nivel de formación y en qué Núcleo Básico del Conocimiento (NBC) está
 * clasificado. No certifica que una persona concreta se graduó: eso lo prueba el
 * diploma o el acta. Por eso aquí se resuelve el PROGRAMA, no a la persona.
 */
import { columna, type Fila, type Tabla } from './tabla';
import { canonizar, normalizar, parecido, terminos } from './texto';

export interface ProgramaSnies {
  codigoSnies: string;
  nombrePrograma: string;
  tituloOtorgado: string;
  codigoInstitucion: string;
  nombreInstitucion: string;
  nivelAcademico: string;
  nivelFormacion: string;
  nbc: string;
  areaConocimiento: string;
  campoAmplio: string;
  campoEspecifico: string;
  campoDetallado: string;
  estado: string;
  modalidad: string;
  municipio: string;
}

/** Alias de columnas: exportación del portal SNIES y conjunto de datos abiertos. `*` = prefijo. */
export const ALIAS_SNIES: Record<keyof ProgramaSnies, string[]> = {
  codigoSnies: ['codigo snies del programa', 'codigo snies programa', 'codigo snies', 'codigo_snies*', 'snies'],
  nombrePrograma: ['nombre del programa', 'nombre programa', 'programa academico', 'programa'],
  tituloOtorgado: ['titulo otorgado', 'titulo'],
  codigoInstitucion: ['codigo institucion', 'codigo de la institucion', 'codigo ies', 'codigo institucion padre'],
  nombreInstitucion: ['nombre institucion', 'nombre de la institucion', 'institucion de educacion superior ies', 'institucion*', 'nombre ies', 'ies'],
  nivelAcademico: ['nivel academico'],
  nivelFormacion: ['nivel de formacion', 'nivel formacion'],
  nbc: ['nucleo basico del conocimiento', 'nucleo basico del conocimiento nbc', 'nucleo basico*', 'nbc'],
  areaConocimiento: ['area de conocimiento', 'area conocimiento'],
  campoAmplio: ['cine f 2013 ac campo amplio', 'campo amplio*'],
  campoEspecifico: ['cine f 2013 ac campo especifico', 'campo especifico*'],
  campoDetallado: ['cine f 2013 ac campo detallado', 'campo detallado*'],
  estado: ['estado programa', 'estado del programa', 'estado'],
  modalidad: ['modalidad', 'metodologia'],
  municipio: ['municipio oferta programa', 'municipio de oferta del programa', 'municipio*'],
};

export function programaDesdeFila(f: Fila): ProgramaSnies {
  const p = {} as ProgramaSnies;
  for (const k of Object.keys(ALIAS_SNIES) as Array<keyof ProgramaSnies>) p[k] = columna(f, ALIAS_SNIES[k]);
  p.codigoSnies = p.codigoSnies.replace(/\.0+$/, '').trim();
  p.codigoInstitucion = p.codigoInstitucion.replace(/\.0+$/, '').trim();
  return p;
}

export interface CandidatoSnies {
  programa: ProgramaSnies;
  /** 0..1: parecido de la institución declarada con la del SNIES (1 si no se declaró). */
  parecidoInstitucion: number;
  /** 0..1: parecido de la denominación del diploma con el nombre del programa o el título otorgado. */
  parecidoPrograma: number;
  confianza: number;
}

export interface ResolucionSnies {
  /** CODIGO: por código SNIES coherente · DENOMINACION: por institución + programa · NO_ENCONTRADO */
  via: 'CODIGO' | 'DENOMINACION' | 'NO_ENCONTRADO';
  elegido: CandidatoSnies | null;
  /** Otros candidatos plausibles (ambigüedad). */
  alternativos: CandidatoSnies[];
  alertas: string[];
}

const UMBRAL_INSTITUCION = 0.55;
const UMBRAL_PROGRAMA = 0.6;
/** Por debajo de esta diferencia con el mejor, un candidato se considera alternativo. */
const MARGEN_AMBIGUEDAD = 0.08;

export class CatalogoSnies {
  readonly programas: ProgramaSnies[];
  private porCodigo = new Map<string, ProgramaSnies[]>();
  private porInstitucion = new Map<string, ProgramaSnies[]>();
  private institucionesNombre = new Map<string, string>();

  constructor(programas: ProgramaSnies[]) {
    this.programas = programas.filter((p) => p.nombrePrograma || p.codigoSnies);
    for (const p of this.programas) {
      if (p.codigoSnies) {
        const l = this.porCodigo.get(p.codigoSnies) || [];
        l.push(p);
        this.porCodigo.set(p.codigoSnies, l);
      }
      const ki = canonizar(p.nombreInstitucion);
      const l = this.porInstitucion.get(ki) || [];
      l.push(p);
      this.porInstitucion.set(ki, l);
      this.institucionesNombre.set(ki, p.nombreInstitucion);
    }
  }

  static desdeTabla(t: Tabla): CatalogoSnies {
    const cat = new CatalogoSnies(t.filas.map(programaDesdeFila));
    if (!cat.programas.length) {
      throw new Error(
        'No se reconocieron programas en el archivo del SNIES. Verifique que tenga columnas como '
        + '«CÓDIGO SNIES DEL PROGRAMA», «NOMBRE DEL PROGRAMA», «NOMBRE INSTITUCIÓN» y «NÚCLEO BÁSICO DEL CONOCIMIENTO».',
      );
    }
    return cat;
  }

  /** Columnas que el archivo no trae y que el cotejo necesita. */
  columnasFaltantes(): string[] {
    const faltan: string[] = [];
    const algun = (k: keyof ProgramaSnies) => this.programas.some((p) => p[k]);
    if (!algun('codigoSnies')) faltan.push('código SNIES del programa');
    if (!algun('nombreInstitucion')) faltan.push('nombre de la institución');
    if (!algun('nivelFormacion')) faltan.push('nivel de formación');
    if (!algun('nbc')) faltan.push('núcleo básico del conocimiento (NBC)');
    if (!algun('tituloOtorgado')) faltan.push('título otorgado');
    return faltan;
  }

  get totalInstituciones(): number {
    return this.porInstitucion.size;
  }

  porCodigoSnies(codigo: string): ProgramaSnies[] {
    return this.porCodigo.get(codigo.replace(/\D/g, '')) || this.porCodigo.get(codigo.trim()) || [];
  }

  /** Instituciones cuyo nombre se parece al declarado, de mayor a menor. */
  institucionesParecidas(nombre: string): Array<{ clave: string; nombre: string; parecido: number }> {
    if (!normalizar(nombre)) return [];
    const objetivo = canonizar(nombre);
    const salida: Array<{ clave: string; nombre: string; parecido: number }> = [];
    for (const [clave, nom] of this.institucionesNombre) {
      let s = parecido(objetivo, clave);
      // Siglas: «UPN», «UdeA» frente al nombre completo.
      const sigla = normalizar(nombre).replace(/\s/g, '');
      if (sigla.length >= 3 && sigla.length <= 8 && iniciales(clave).startsWith(sigla)) s = Math.max(s, 0.7);
      if (s >= UMBRAL_INSTITUCION) salida.push({ clave, nombre: nom, parecido: s });
    }
    return salida.sort((a, b) => b.parecido - a.parecido);
  }

  /**
   * Resuelve un título contra el SNIES.
   * 1. Con código: se toma el programa y se verifica que la institución y la denominación
   *    sean coherentes con lo declarado (un código ajeno es una alerta, no una prueba).
   * 2. Sin código o con código incoherente: institución parecida → programa parecido.
   */
  resolver(entrada: { codigoSnies?: string; institucion?: string; programa: string }): ResolucionSnies {
    const alertas: string[] = [];
    const codigo = (entrada.codigoSnies || '').replace(/\.0+$/, '').trim();
    const programa = entrada.programa || '';
    const institucion = entrada.institucion || '';

    if (codigo) {
      const encontrados = this.porCodigoSnies(codigo);
      if (!encontrados.length) {
        alertas.push(`El código SNIES ${codigo} no existe en el catálogo cargado.`);
      } else {
        const evaluados = encontrados.map((p) => evaluar(p, institucion, programa)).sort((a, b) => b.confianza - a.confianza);
        const mejor = evaluados[0];
        const coherente = mejor.parecidoPrograma >= UMBRAL_PROGRAMA
          && (!institucion || mejor.parecidoInstitucion >= UMBRAL_INSTITUCION);
        if (coherente) return { via: 'CODIGO', elegido: mejor, alternativos: [], alertas };
        alertas.push(
          `El código SNIES ${codigo} corresponde a «${mejor.programa.nombrePrograma}» de `
          + `«${mejor.programa.nombreInstitucion}», que no coincide con lo declarado. `
          + 'Se buscó por institución y denominación; el desajuste debe revisarse en el documento.',
        );
      }
    }

    // Universo: programas de instituciones parecidas; sin institución, todo el catálogo.
    let universo: Array<{ p: ProgramaSnies; si: number }> = [];
    const insts = this.institucionesParecidas(institucion);
    if (insts.length) {
      for (const i of insts.slice(0, 6)) {
        for (const p of this.porInstitucion.get(i.clave) || []) universo.push({ p, si: i.parecido });
      }
    } else {
      if (institucion) alertas.push(`La institución «${institucion}» no se encontró en el SNIES cargado.`);
      universo = this.programas.map((p) => ({ p, si: institucion ? 0 : 1 }));
    }

    const candidatos: CandidatoSnies[] = [];
    for (const { p, si } of universo) {
      const c = evaluar(p, '', programa);
      c.parecidoInstitucion = si;
      c.confianza = institucion ? 0.35 * si + 0.65 * c.parecidoPrograma : c.parecidoPrograma * 0.9;
      if (c.parecidoPrograma >= UMBRAL_PROGRAMA) candidatos.push(c);
    }
    candidatos.sort((a, b) => b.confianza - a.confianza);
    if (!candidatos.length) {
      alertas.push(`No se encontró en el SNIES un programa equivalente a «${programa}».`);
      return { via: 'NO_ENCONTRADO', elegido: null, alternativos: [], alertas };
    }
    const elegido = candidatos[0];
    const alternativos = candidatos.slice(1).filter((c) =>
      elegido.confianza - c.confianza <= MARGEN_AMBIGUEDAD
      && !(c.programa.codigoSnies && c.programa.codigoSnies === elegido.programa.codigoSnies));
    return { via: 'DENOMINACION', elegido, alternativos: alternativos.slice(0, 5), alertas };
  }
}

function iniciales(texto: string): string {
  return terminos(texto).map((p) => p[0]).join('');
}

function evaluar(p: ProgramaSnies, institucion: string, programa: string): CandidatoSnies {
  const pp = Math.max(parecido(programa, p.nombrePrograma), p.tituloOtorgado ? parecido(programa, p.tituloOtorgado) : 0);
  const pi = institucion ? parecido(institucion, p.nombreInstitucion) : 1;
  return { programa: p, parecidoInstitucion: pi, parecidoPrograma: pp, confianza: 0.35 * pi + 0.65 * pp };
}

/** Nivel de formación del SNIES llevado a una categoría estable. */
export type Nivel =
  | 'NORMALISTA'
  | 'TECNICA_PROFESIONAL'
  | 'TECNOLOGICA'
  | 'UNIVERSITARIA'
  | 'ESPECIALIZACION'
  | 'MAESTRIA'
  | 'DOCTORADO'
  | 'DESCONOCIDO';

export function clasificarNivel(texto: string): Nivel {
  const t = normalizar(texto);
  if (!t) return 'DESCONOCIDO';
  if (/normalista|normal superior|formacion complementaria/.test(t)) return 'NORMALISTA';
  if (/doctor/.test(t)) return 'DOCTORADO';
  if (/maestr|magist/.test(t)) return 'MAESTRIA';
  if (/especializ|especialista/.test(t)) return 'ESPECIALIZACION';
  if (/tecnolog/.test(t)) return 'TECNOLOGICA';
  if (/tecnic/.test(t)) return 'TECNICA_PROFESIONAL';
  if (/universit|pregrado|profesional|licenciatura/.test(t)) return 'UNIVERSITARIA';
  return 'DESCONOCIDO';
}

/** Deduce el nivel desde la denominación del diploma, cuando no hay SNIES ni nivel declarado. */
export function nivelPorDenominacion(denominacion: string): Nivel {
  const t = canonizar(denominacion);
  if (/^doctorado\b/.test(t)) return 'DOCTORADO';
  if (/^maestria\b/.test(t)) return 'MAESTRIA';
  if (/^especializacion\b/.test(t)) return 'ESPECIALIZACION';
  if (/^tecnolog/.test(t)) return 'TECNOLOGICA';
  if (/^tecnic/.test(t)) return 'TECNICA_PROFESIONAL';
  if (/normalista/.test(t)) return 'NORMALISTA';
  if (/^licenciatura\b/.test(t)) return 'UNIVERSITARIA';
  return 'DESCONOCIDO';
}

export const NOMBRE_NIVEL: Record<Nivel, string> = {
  NORMALISTA: 'Normalista superior',
  TECNICA_PROFESIONAL: 'Técnica profesional',
  TECNOLOGICA: 'Tecnológica',
  UNIVERSITARIA: 'Universitaria (pregrado)',
  ESPECIALIZACION: 'Especialización',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
  DESCONOCIDO: 'Sin determinar',
};

export const ES_POSGRADO: Record<Nivel, boolean> = {
  NORMALISTA: false, TECNICA_PROFESIONAL: false, TECNOLOGICA: false, UNIVERSITARIA: false,
  ESPECIALIZACION: true, MAESTRIA: true, DOCTORADO: true, DESCONOCIDO: false,
};
