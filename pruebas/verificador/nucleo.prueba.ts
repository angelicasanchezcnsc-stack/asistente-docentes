/**
 * Pruebas del núcleo del verificador de títulos (verificador-titulos/nucleo/). Las empaqueta y
 * ejecuta pruebas/verificador_titulos.mjs. Los datos de pruebas/verificador/ son inventados y
 * solo prueban el motor: no reproducen el SNIES real ni la Resolución MEN 003842 de 2022.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { leerArchivoTabla, leerCsvCrudo } from '../../verificador-titulos/nucleo/tabla';
import { CatalogoSnies } from '../../verificador-titulos/nucleo/snies';
import { manualDesdeTabla } from '../../verificador-titulos/nucleo/manual';
import { verificarAspirante, type Aspirante, type TituloDeclarado } from '../../verificador-titulos/nucleo/motor';
import { aspirantesDesdeTabla, informeCsv, procesarLote, resumir } from '../../verificador-titulos/nucleo/lote';
import { leerParametrosVA } from '../../verificador-titulos/nucleo/va';
import { canonizar, leerFecha, parecido } from '../../verificador-titulos/nucleo/texto';

let fallos = 0;
let corridas = 0;
const assert = (cond: boolean, msg: string): void => {
  corridas++;
  if (cond) console.log('  ✅', msg);
  else { console.error('  ❌ FALLO:', msg); fallos++; }
};

const DIR = process.env.VERIFICADOR_DATOS!;
const leer = (n: string) => readFileSync(path.join(DIR, n), 'utf8');

const snies = CatalogoSnies.desdeTabla(await leerArchivoTabla('snies.csv', leer('snies-ficticio.csv'), ['codigo snies', 'programa']));
const manual = manualDesdeTabla(await leerArchivoTabla('manual.csv', leer('manual-ficticio.csv')));
const P = { fechaCorte: '2026-12-15' };

const asp = (empleoId: string, ...titulos: TituloDeclarado[]): Aspirante => ({ inscripcion: 'I-1', opec: '1', empleoId, titulos });
const t = (programa: string, institucion = '', extra: Partial<TituloDeclarado> = {}): TituloDeclarado => ({ programa, institucion, fechaGrado: '2015-06-01', ...extra });

console.log('\n▶ Texto');
assert(canonizar('Licenciado en Matemáticas') === canonizar('LICENCIATURA EN MATEMATICAS'), 'licenciado ≡ licenciatura, sin tildes ni mayúsculas');
assert(leerFecha('15/12/2026') === '2026-12-15' && leerFecha('2026-12-15') === '2026-12-15', 'fechas dd/mm/aaaa y aaaa-mm-dd');
assert(leerFecha('46371') === '2026-12-15', 'número de serie de Excel');
assert(leerFecha('31/02/2026') === null, 'fecha imposible → null');
assert(parecido('Universidad Pedagogica de Prueba', 'UNIVERSIDAD PEDAGÓGICA DE PRUEBA') === 1, 'parecido 1 entre variantes de la misma institución');
assert(leerCsvCrudo('a;b\n"x;y";"di ""z"""\n')[1][1] === 'di "z"', 'CSV con comillas y separador dentro');

console.log('\n▶ Carga');
assert(snies.programas.length === 14, `SNIES: 14 programas (leídos ${snies.programas.length}) tras saltar la fila de título`);
assert(snies.columnasFaltantes().length === 0, 'SNIES: no faltan columnas');
assert(manual.empleos.size === 6, `Manual: 6 empleos (leídos ${manual.empleos.size})`);

console.log('\n▶ Requisito mínimo');
let d = verificarAspirante(asp('DA-MAT', t('Licenciado en Matemáticas', 'Universidad Pedagógica de Prueba')), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'licenciatura exacta → cumple');
assert(d.titulos[0].snies?.elegido?.programa.codigoSnies === '90001', 'se ubica el programa 90001 sin código declarado');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas y Física', 'Univ. Pedagógica de Prueba', { codigoSnies: '90002' })), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'denominación con término adicional → cumple');
assert(d.titulos[0].snies?.via === 'CODIGO', 'resuelto por código SNIES coherente');
assert(d.titulos[0].alertas.some((a) => /inactivo/.test(a)), 'programa inactivo → alerta informativa, no rechazo');

d = verificarAspirante(asp('DA-MAT', t('Estadístico', 'Universidad Nacional de Ensayo')), manual, snies, P);
assert(d.resultado === 'CUMPLE' && d.titulos[0].coincidencia?.regla.modo === 'NBC', 'profesional por NBC del SNIES → cumple');

d = verificarAspirante(asp('DA-MAT', t('Especialización en Estadística Aplicada', 'Universidad Nacional de Ensayo')), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'posgrado en el NBC no suple el pregrado');
assert(d.titulos[0].motivos.some((m) => /posgrado no suple/.test(m)), 'motivo explícito: el posgrado no suple el pregrado');

d = verificarAspirante(asp('DA-MAT', t('Administración de Empresas', 'Fundación Universitaria de Prueba')), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'título ajeno al área → no cumple');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad Pedagógica de Prueba', { fechaGrado: '2027-01-10' })), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'título posterior al cierre de inscripciones → no se tiene en cuenta');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad Pedagógica de Prueba', { fechaGrado: null })), manual, snies, P);
assert(d.resultado === 'REVISION', 'sin fecha de grado → revisión humana');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Educación Básica', 'Institución Universitaria Doble')), manual, snies, P);
assert(d.resultado === 'REVISION', 'dos programas SNIES plausibles con resultado distinto → revisión humana');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Educación Básica con énfasis en Matemáticas', 'Institución Universitaria Doble', { codigoSnies: '90040' })), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'con código SNIES se resuelve la ambigüedad → cumple');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad Pedagógica de Prueba', { codigoSnies: '90012' })), manual, snies, P);
assert(d.titulos[0].alertas.some((a) => /no coincide con lo declarado/.test(a)), 'código SNIES de otro programa → alerta');
assert(d.resultado === 'CUMPLE', '…y se resuelve por institución y denominación');

d = verificarAspirante(asp('DA-SOC', t('Derecho', 'Universidad Nacional de Ensayo')), manual, snies, P);
assert(d.resultado === 'REVISION', 'regla marcada «revisar» → revisión humana, no cumple automático');

d = verificarAspirante(asp('DA-PRI', t('Normalista Superior', 'Escuela Normal Superior de Prueba', { nivel: 'normalista' })), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'normalista superior para primaria → cumple sin SNIES');

d = verificarAspirante(asp('DA-MAT', t('Normalista Superior', 'Escuela Normal Superior de Prueba', { nivel: 'normalista' })), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'normalista superior para matemáticas (sin regla) → no cumple');

d = verificarAspirante(asp('DIR-REC', t('Administración de Empresas', 'Fundación Universitaria de Prueba')), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'rector: cualquier pregrado universitario (regla NIVEL) → cumple');

d = verificarAspirante(asp('DIR-REC', t('Tecnología en Sistemas', 'Universidad Nacional de Ensayo')), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'rector: tecnólogo → no cumple');

d = verificarAspirante(asp('DA-TEC', t('Ingeniería de Sistemas', 'Corporación Universitaria del Ejemplo')), manual, snies, P);
assert(d.resultado === 'CUMPLE', 'tecnología e informática por NBC → cumple');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad de Otro País', { pais: 'España', apostillado: true })), manual, snies, P);
assert(d.resultado === 'REVISION' && d.titulos[0].extranjero, 'título del exterior → revisión humana con regla del Criterio Unificado');

d = verificarAspirante(asp('NO-EXISTE', t('Licenciatura en Matemáticas')), manual, snies, P);
assert(d.resultado === 'REVISION' && d.empleo === null, 'empleo inexistente en el manual → revisión');

d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad Pedagógica de Prueba')), manual, null, P);
assert(d.resultado === 'REVISION', 'sin SNIES cargado → la coincidencia por denominación no basta');

d = verificarAspirante(asp('DA-MAT'), manual, snies, P);
assert(d.resultado === 'NO_CUMPLE', 'sin títulos → no cumple');

console.log('\n▶ Lote, VA e informe');
const tablaAsp = await leerArchivoTabla('asp.csv', [
  'inscripcion;opec;empleo_id;folio;institucion;programa;codigo_snies;fecha_grado;pais;convalidado',
  'A-1;100;DA-MAT;1;Universidad Pedagógica de Prueba;Licenciatura en Matemáticas;;10/06/2012;;',
  'A-1;100;DA-MAT;2;Universidad Pedagógica de Prueba;Maestría en Educación;;20/11/2018;;',
  'A-1;100;DA-MAT;3;Universidad Nacional de Ensayo;Especialización en Estadística Aplicada;;05/05/2016;;',
  'A-1;100;DA-MAT;4;Universidad Nacional de Ensayo;Derecho;;05/05/2010;;',
  'A-2;100;DA-MAT;1;Fundación Universitaria de Prueba;Administración de Empresas;;01/01/2010;;',
  'A-3;200;DIR-REC;;;;;;;',
  ';;;;;;;;;',
  'A-4;100;;1;x;y;;;;',
].join('\n'));
const { aspirantes, errores } = aspirantesDesdeTabla(tablaAsp);
assert(aspirantes.length === 3, `3 aspirantes agrupados por inscripción (leídos ${aspirantes.length})`);
assert(errores.length === 1 && /falta el empleo/.test(errores[0].mensaje), 'fila sin empleo → error de carga reportado');

const params = leerParametrosVA(JSON.stringify({
  fuente: 'Parámetros ficticios de prueba',
  topeFactor: 30,
  exigeRelacion: true,
  categorias: { REQUISITO_MINIMO: { puntosPorTitulo: 10, maximo: 10 }, MAESTRIA: { puntosPorTitulo: 15, maximo: 15 }, ESPECIALIZACION: { puntosPorTitulo: 10, maximo: 10 }, PREGRADO_ADICIONAL: { puntosPorTitulo: 10, maximo: 10 } },
}));
const rs = procesarLote(aspirantes, manual, snies, P, params);
const a1 = rs.find((r) => r.dictamen.aspirante.inscripcion === 'A-1')!;
assert(a1.dictamen.resultado === 'CUMPLE' && a1.dictamen.tituloRequisito === 0, 'A-1 cumple con el folio 1');
const cat = (i: number) => a1.va.titulos.find((x) => x.indice === i)!;
assert(cat(0).categoria === 'REQUISITO_MINIMO', 'VA: el título del requisito se valora en su propia categoría');
assert(cat(1).categoria === 'MAESTRIA' && cat(1).relacion === 'PROBABLE', 'VA: maestría en educación, relación probable');
assert(cat(2).categoria === 'ESPECIALIZACION' && cat(2).relacion === 'PROBABLE', 'VA: especialización en estadística, relación probable por el campo CINE (matemáticas)');
assert(cat(3).categoria === 'PREGRADO_ADICIONAL' && cat(3).relacion === 'POR_ESTABLECER' && cat(3).puntos === 0, 'VA: pregrado sin relación evidente no puntúa hasta confirmarla');
assert(a1.va.puntajeProyectado === 30, `VA: 10+15+10 = 35 con tope 30 (proyectado ${a1.va.puntajeProyectado})`);

const res = resumir(rs);
assert(res.total === 3 && res.cumple === 1 && res.noCumple === 2, `resumen: 3 aspirantes, 1 cumple, 2 no cumplen (A-2 título ajeno, A-3 sin títulos) (${JSON.stringify(res)})`);

const csv = informeCsv(rs);
assert(csv.startsWith('﻿') && csv.split('\r\n')[0].includes('Dictamen del aspirante'), 'informe CSV con BOM y encabezados');
assert(csv.split('\r\n').filter(Boolean).length === 1 + 4 + 1 + 1, 'informe: una fila por título y una por aspirante sin títulos');
const formula = informeCsv([{ ...rs[1], dictamen: { ...rs[1].dictamen, aspirante: { ...rs[1].dictamen.aspirante, inscripcion: '=HYPERLINK("x")' } } }]);
assert(formula.includes(`"'=HYPERLINK(""x"")"`), 'informe: neutraliza celdas que Excel leería como fórmula');

console.log('\n▶ XLSX (generado con openpyxl, sin dependencias para leerlo)');
const xlsx = new Uint8Array(readFileSync(path.join(DIR, 'snies-ficticio.xlsx')));
const sx = CatalogoSnies.desdeTabla(await leerArchivoTabla('snies-ficticio.xlsx', xlsx, ['codigo snies', 'programa']));
assert(sx.programas.length === 15, `XLSX: 15 programas (leídos ${sx.programas.length}), primera hoja según workbook.xml, encabezado buscado`);
assert(sx.porCodigoSnies('90001')[0]?.nombrePrograma === 'LICENCIATURA EN MATEMÁTICAS', 'XLSX: tildes y código numérico leídos');
assert(sx.columnasFaltantes().length === 0, 'XLSX: no faltan columnas');
d = verificarAspirante(asp('DA-MAT', t('Licenciatura en Matemáticas', 'Universidad Pedagógica de Prueba')), manual, sx, P);
assert(d.resultado === 'CUMPLE', 'XLSX: el mismo dictamen que con el CSV');
let error = '';
try { await leerArchivoTabla('x.xlsx', new Uint8Array([1, 2, 3])); } catch (e) { error = (e as Error).message; }
assert(/no es un \.xlsx válido/.test(error), 'XLSX dañado → mensaje claro');

export const resultado = { fallos, corridas };
