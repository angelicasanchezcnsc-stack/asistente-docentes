/**
 * Requisitos de formación del Manual de Funciones, Requisitos y Competencias para
 * docentes y directivos docentes, llevados a reglas verificables.
 *
 * La herramienta NO trae el contenido del manual: lo carga el Despacho desde el texto
 * vigente (Resolución MEN 003842 de 2022 y sus modificaciones, en la versión a la que
 * remita el Anexo Técnico del proceso). Así ningún requisito queda escrito «de memoria»
 * en el código, y un cambio del MEN se refleja editando una tabla, no el programa.
 *
 * Una fila = una denominación o criterio aceptado para un empleo. Columnas:
 *   empleo_id · empleo · area · modo · valor · niveles · excluye · estado · fuente · nota
 */
import { columna, type Tabla } from './tabla';
import { normalizar } from './texto';
import { clasificarNivel, type Nivel } from './snies';

/**
 * EXACTA     la denominación del título es esa (tras normalizar).
 * CONTIENE   el título contiene la denominación como frase («… con término adicional»).
 * TERMINOS   el título contiene todas las palabras indicadas, en cualquier orden (separadas por «+»).
 * NBC        el programa está clasificado en ese NBC del SNIES (exige resolución SNIES).
 * CAMPO      el programa está en ese campo CINE (amplio, específico o detallado) del SNIES.
 * NIVEL      cualquier título de ese nivel de formación (p. ej. «licenciado o profesional»).
 * NORMALISTA título de normalista superior (no está en el SNIES: se verifica con el documento).
 * EXCLUYE    el título que contenga esta denominación no sirve para el empleo, aunque coincida
 *            con una regla CONTIENE, TERMINOS, NBC, CAMPO o NIVEL (no prevalece sobre EXACTA).
 */
export type Modo = 'EXACTA' | 'CONTIENE' | 'TERMINOS' | 'NBC' | 'CAMPO' | 'NIVEL' | 'NORMALISTA' | 'EXCLUYE';

/**
 * VIGENTE   se aplica.
 * REVISAR   si coincide, el resultado pasa a revisión humana (p. ej. una denominación cuya
 *           vigencia depende de una decisión judicial cuya ejecutoria no está acreditada).
 * INACTIVA  se conserva para la traza, pero no se aplica.
 */
export type EstadoRegla = 'VIGENTE' | 'REVISAR' | 'INACTIVA';

export interface Regla {
  id: string;
  empleoId: string;
  modo: Modo;
  valor: string;
  niveles: Nivel[];
  excluye: string[];
  estado: EstadoRegla;
  fuente: string;
  nota: string;
}

export interface Empleo {
  id: string;
  denominacion: string;
  area: string;
  reglas: Regla[];
}

export interface Manual {
  titulo: string;
  version: string;
  empleos: Map<string, Empleo>;
  advertencias: string[];
}

const MODOS: Modo[] = ['EXACTA', 'CONTIENE', 'TERMINOS', 'NBC', 'CAMPO', 'NIVEL', 'NORMALISTA', 'EXCLUYE'];

function leerModo(v: string): Modo | null {
  const t = normalizar(v).toUpperCase().replace(/\s/g, '');
  return (MODOS as string[]).includes(t) ? (t as Modo) : null;
}

function leerEstado(v: string): EstadoRegla {
  const t = normalizar(v);
  if (t.startsWith('revis') || t.startsWith('suspend')) return 'REVISAR';
  if (t.startsWith('inact') || t === 'no' || t.startsWith('derog')) return 'INACTIVA';
  return 'VIGENTE';
}

function leerNiveles(v: string, modo: Modo): Nivel[] {
  if (modo === 'NORMALISTA') return ['NORMALISTA'];
  const partes = v.split(/[|;,]/).map((x) => x.trim()).filter(Boolean);
  if (!partes.length) return ['UNIVERSITARIA'];
  const niveles = partes.map((p) => clasificarNivel(p)).filter((n) => n !== 'DESCONOCIDO');
  return niveles.length ? niveles : ['UNIVERSITARIA'];
}

export interface FilaManual {
  empleo_id: string;
  empleo: string;
  area?: string;
  modo: string;
  valor: string;
  niveles?: string;
  excluye?: string;
  estado?: string;
  fuente?: string;
  nota?: string;
}

/** Construye el manual desde filas (CSV/XLSX ya leídos, o el arreglo `reglas` de un JSON). */
export function construirManual(filas: FilaManual[], titulo = 'Manual de funciones cargado', version = ''): Manual {
  const empleos = new Map<string, Empleo>();
  const advertencias: string[] = [];
  filas.forEach((f, i) => {
    const n = i + 2; // fila de la hoja, contando el encabezado
    const empleoId = (f.empleo_id || '').trim();
    if (!empleoId) return;
    const modo = leerModo(f.modo || '');
    if (!modo) {
      advertencias.push(`Fila ${n}: modo «${f.modo}» no reconocido; se esperaba ${MODOS.join(', ')}. La fila se omitió.`);
      return;
    }
    const valor = (f.valor || '').trim();
    if (!valor && modo !== 'NORMALISTA') {
      advertencias.push(`Fila ${n}: la regla ${modo} del empleo ${empleoId} no tiene valor. La fila se omitió.`);
      return;
    }
    let e = empleos.get(empleoId);
    if (!e) {
      e = { id: empleoId, denominacion: (f.empleo || '').trim(), area: (f.area || '').trim(), reglas: [] };
      empleos.set(empleoId, e);
    }
    if (!e.denominacion && f.empleo) e.denominacion = f.empleo.trim();
    if (!e.area && f.area) e.area = f.area.trim();
    if (!(f.fuente || '').trim()) {
      advertencias.push(`Fila ${n}: la regla «${valor}» del empleo ${empleoId} no indica la fuente (numeral del manual).`);
    }
    e.reglas.push({
      id: `${empleoId}#${e.reglas.length + 1}`,
      empleoId,
      modo,
      valor,
      niveles: leerNiveles(f.niveles || '', modo),
      excluye: (f.excluye || '').split('|').map((x) => x.trim()).filter(Boolean),
      estado: leerEstado(f.estado || ''),
      fuente: (f.fuente || '').trim(),
      nota: (f.nota || '').trim(),
    });
  });
  for (const e of empleos.values()) {
    if (!e.reglas.some((r) => r.modo !== 'EXCLUYE' && r.estado !== 'INACTIVA')) {
      advertencias.push(`El empleo ${e.id} no tiene ninguna regla aplicable: todo título resultará «no cumple».`);
    }
  }
  return { titulo, version, empleos, advertencias };
}

const ALIAS_MANUAL: Record<keyof FilaManual, string[]> = {
  empleo_id: ['empleo id', 'id empleo', 'codigo empleo', 'empleo_id'],
  empleo: ['empleo', 'denominacion empleo', 'cargo'],
  area: ['area', 'area o asignatura', 'nivel o area'],
  modo: ['modo', 'tipo de regla', 'criterio'],
  valor: ['valor', 'denominacion', 'titulo', 'titulo aceptado'],
  niveles: ['niveles', 'nivel', 'nivel de formacion'],
  excluye: ['excluye', 'salvo'],
  estado: ['estado', 'vigencia'],
  fuente: ['fuente', 'numeral', 'fundamento'],
  nota: ['nota', 'observacion', 'observaciones'],
};

export function manualDesdeTabla(t: Tabla, titulo?: string): Manual {
  const filas: FilaManual[] = t.filas.map((f) => {
    const r = {} as FilaManual;
    for (const k of Object.keys(ALIAS_MANUAL) as Array<keyof FilaManual>) r[k] = columna(f, ALIAS_MANUAL[k]);
    return r;
  });
  const m = construirManual(filas, titulo);
  if (!m.empleos.size) {
    throw new Error(
      'El archivo del manual no tiene reglas reconocibles. Use la plantilla: columnas '
      + 'empleo_id, empleo, area, modo, valor, niveles, excluye, estado, fuente, nota.',
    );
  }
  return m;
}

/** JSON: `{ "titulo": "...", "version": "...", "reglas": [ { empleo_id, empleo, modo, valor, ... } ] }`. */
export function manualDesdeJson(texto: string): Manual {
  const j = JSON.parse(texto);
  const reglas: FilaManual[] = Array.isArray(j) ? j : j.reglas;
  if (!Array.isArray(reglas)) throw new Error('El JSON del manual debe tener un arreglo «reglas».');
  const m = construirManual(reglas, j.titulo, j.version);
  if (!m.empleos.size) throw new Error('El JSON del manual no tiene reglas reconocibles.');
  return m;
}

/** Busca el empleo por id exacto, o por denominación + área cuando el id no coincide. */
export function buscarEmpleo(manual: Manual, id: string): Empleo | undefined {
  const directo = manual.empleos.get(id.trim());
  if (directo) return directo;
  const n = normalizar(id);
  for (const e of manual.empleos.values()) {
    if (normalizar(e.id) === n) return e;
    if (normalizar(`${e.denominacion} ${e.area}`) === n) return e;
  }
  return undefined;
}

export const MODO_LEGIBLE: Record<Modo, string> = {
  EXACTA: 'denominación idéntica',
  CONTIENE: 'denominación exigida con término adicional',
  TERMINOS: 'contiene los términos exigidos',
  NBC: 'núcleo básico del conocimiento',
  CAMPO: 'campo CINE del SNIES',
  NIVEL: 'nivel de formación',
  NORMALISTA: 'normalista superior',
  EXCLUYE: 'exclusión',
};

export type { Nivel };
