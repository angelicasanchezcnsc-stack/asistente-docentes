/**
 * Lectura de tablas (CSV/TSV y XLSX) sin dependencias: el XLSX se abre con el lector
 * ZIP de `zip.ts`. Funciona igual en el navegador y en Node.
 *
 * El SNIES exporta sus consultas en Excel con filas de título antes del encabezado;
 * por eso el encabezado se busca, no se asume en la fila 1.
 */
import { abrirZip } from './zip';
import { normalizar } from './texto';

export type Fila = Record<string, string>;

export interface Tabla {
  encabezados: string[];
  filas: Fila[];
}

/**
 * Detecta el separador por las primeras líneas con contenido (la primera puede ser un
 * título sin separadores, como en las exportaciones del SNIES).
 */
function detectarSeparador(muestra: string): string {
  const lineas = muestra.split(/\r?\n/).filter((l) => l.trim()).slice(0, 10);
  const mediana = (xs: number[]) => {
    const o = [...xs].sort((a, b) => a - b);
    return o.length ? o[Math.floor(o.length / 2)] : 0;
  };
  const cuentas: Array<[string, number]> = [';', ',', '\t', '|'].map((s) => [
    s,
    mediana(lineas.map((l) => l.split(s).length - 1)),
  ]);
  cuentas.sort((a, b) => b[1] - a[1]);
  return cuentas[0][1] > 0 ? cuentas[0][0] : ',';
}

/** CSV con comillas dobles, saltos de línea dentro de comillas y BOM. */
export function leerCsvCrudo(texto: string, separador?: string): string[][] {
  const t = texto.replace(/^﻿/, '');
  const sep = separador || detectarSeparador(t);
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c === '"') {
        if (t[i + 1] === '"') { celda += '"'; i++; } else comillas = false;
      } else celda += c;
    } else if (c === '"' && celda === '') {
      comillas = true;
    } else if (c === sep) {
      fila.push(celda); celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      fila.push(celda); celda = '';
      filas.push(fila); fila = [];
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  return filas.filter((f) => f.some((v) => v.trim() !== ''));
}

/**
 * Convierte filas crudas en registros. El encabezado es la primera fila (dentro de
 * las primeras 30) que contiene todas las `pistas`; si no se dan pistas, la primera fila.
 */
export function aTabla(crudas: string[][], pistas: string[] = []): Tabla {
  let idx = 0;
  if (pistas.length) {
    const p = pistas.map(normalizar);
    const encontrado = crudas.slice(0, 30).findIndex((f) => {
      const celdas = f.map(normalizar).join(' | ');
      return p.every((x) => celdas.includes(x));
    });
    if (encontrado >= 0) idx = encontrado;
  }
  const encabezados = (crudas[idx] || []).map((h) => h.trim());
  const filas: Fila[] = [];
  for (const f of crudas.slice(idx + 1)) {
    const r: Fila = {};
    encabezados.forEach((h, i) => { if (h) r[h] = (f[i] ?? '').trim(); });
    filas.push(r);
  }
  return { encabezados, filas };
}

function decodificarXml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

function columnaANumero(ref: string): number {
  const letras = ref.replace(/\d+/g, '');
  let n = 0;
  for (const l of letras) n = n * 26 + (l.charCodeAt(0) - 64);
  return n - 1;
}

/** Primera hoja de un .xlsx como filas crudas. Fechas quedan como número de serie de Excel. */
export async function leerXlsxCrudo(datos: ArrayBuffer | Uint8Array): Promise<string[][]> {
  const zip = abrirZip(datos);
  const compartidas: string[] = [];
  const xmlCompartidas = await zip.leerTexto('xl/sharedStrings.xml');
  if (xmlCompartidas) {
    const xml = xmlCompartidas;
    for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) || []) {
      const partes = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
      compartidas.push(decodificarXml(partes.map((p) => p.replace(/<[^>]+>/g, '')).join('')));
    }
  }
  // La primera hoja según workbook.xml (no siempre es sheet1.xml).
  let rutaHoja = 'xl/worksheets/sheet1.xml';
  const wb = await zip.leerTexto('xl/workbook.xml');
  const rels = await zip.leerTexto('xl/_rels/workbook.xml.rels');
  const rid = wb?.match(/<sheet\b[^>]*r:id="([^"]+)"/)?.[1];
  if (rid && rels) {
    const destino = rels.match(new RegExp(`Id="${rid}"[^>]*Target="([^"]+)"`))?.[1]
      || rels.match(new RegExp(`Target="([^"]+)"[^>]*Id="${rid}"`))?.[1];
    if (destino) rutaHoja = destino.startsWith('/') ? destino.slice(1) : `xl/${destino.replace(/^\.\//, '')}`;
  }
  const xml = await zip.leerTexto(rutaHoja);
  if (!xml) throw new Error('El archivo Excel no tiene hojas legibles.');
  const filas: string[][] = [];
  for (const row of xml.match(/<row\b[\s\S]*?<\/row>/g) || []) {
    const fila: string[] = [];
    for (const c of row.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = c.match(/\br="([A-Z]+\d+)"/)?.[1];
      const tipo = c.match(/\bt="([^"]+)"/)?.[1];
      let valor = '';
      if (tipo === 'inlineStr') {
        valor = decodificarXml((c.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((p) => p.replace(/<[^>]+>/g, '')).join(''));
      } else {
        const v = c.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
        valor = tipo === 's' ? compartidas[+v] ?? '' : decodificarXml(v);
      }
      const col = ref ? columnaANumero(ref) : fila.length;
      while (fila.length < col) fila.push('');
      fila[col] = valor;
    }
    filas.push(fila);
  }
  return filas.filter((f) => f.some((v) => String(v).trim() !== ''));
}

/** Lee CSV/TSV/TXT o XLSX según el nombre del archivo. */
export async function leerArchivoTabla(
  nombre: string,
  datos: ArrayBuffer | Uint8Array | string,
  pistas: string[] = [],
): Promise<Tabla> {
  if (/\.xlsx$/i.test(nombre)) {
    if (typeof datos === 'string') throw new Error('Un .xlsx debe leerse como binario.');
    return aTabla(await leerXlsxCrudo(datos), pistas);
  }
  if (/\.xls$/i.test(nombre)) {
    throw new Error('El formato .xls (Excel 97-2003) no se admite: guárdelo como .xlsx o .csv.');
  }
  const texto = typeof datos === 'string' ? datos : decodificarTexto(datos);
  return aTabla(leerCsvCrudo(texto), pistas);
}

/** UTF-8 si es válido; si no, Windows-1252 (CSV guardado desde Excel en español). */
export function decodificarTexto(datos: ArrayBuffer | Uint8Array): string {
  const bytes = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

/**
 * Busca en una fila el valor de la primera columna cuyo nombre normalizado coincida
 * con alguno de los alias (igualdad, o inclusión si el alias termina en `*`).
 */
export function columna(fila: Fila, alias: string[]): string {
  const claves = Object.keys(fila);
  for (const a of alias) {
    const prefijo = a.endsWith('*');
    const an = normalizar(prefijo ? a.slice(0, -1) : a);
    const k = claves.find((c) => {
      const cn = normalizar(c);
      return prefijo ? cn.startsWith(an) : cn === an;
    });
    if (k !== undefined && fila[k] !== '') return fila[k];
  }
  return '';
}
