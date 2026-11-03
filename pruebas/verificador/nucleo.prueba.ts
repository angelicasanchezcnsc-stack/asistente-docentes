/**
 * Pruebas del núcleo del verificador de títulos (verificador-titulos/nucleo/). Las empaqueta y
 * ejecuta pruebas/verificador_titulos.mjs. Los datos de pruebas/verificador/ son inventados y
 * solo prueban el motor: no reproducen el SNIES real ni la Resolución MEN 003842 de 2022.
 * La última sección carga además el manual transcrito de esa resolución
 * (verificador-titulos/manual/), con un SNIES de ensayo también inventado.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { leerArchivoTabla, leerCsvCrudo } from '../../verificador-titulos/nucleo/tabla';
import { CatalogoSnies } from '../../verificador-titulos/nucleo/snies';
import { manualDesdeTabla } from '../../verificador-titulos/nucleo/manual';
import { verificarAspirante, type Aspirante, type TituloDeclarado } from '../../verificador-titulos/nucleo/motor';
import { aspirantesDesdeTabla, informeCsv, procesarLote, resumir } from '../../verificador-titulos/nucleo/lote';
import { clasificarVA, leerParametrosVA } from '../../verificador-titulos/nucleo/va';
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
assert(/por confirmar/.test(informeCsv([{ dictamen: d, va: clasificarVA(d, P.fechaCorte, null) }])), 'en revisión, el informe marca el título como requisito mínimo «por confirmar»');

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

console.log('\n▶ Manual de la Resolución MEN 003842 de 2022 (verificador-titulos/manual/)');
// El manual es la transcripción real; el SNIES de esta sección sigue siendo inventado.
const textoManual = readFileSync(path.join(DIR, '..', '..', 'verificador-titulos', 'manual', 'manual-funciones-3842-2022.csv'), 'utf8');
const tablaManual = await leerArchivoTabla('manual-funciones-3842-2022.csv', textoManual);
const m3842 = manualDesdeTabla(tablaManual);
const reglas3842 = [...m3842.empleos.values()].flatMap((e) => e.reglas);
assert(m3842.empleos.size === 23, `23 empleos: 3 directivos, preescolar, primaria, 17 áreas y orientador (leídos ${m3842.empleos.size})`);
assert(m3842.advertencias.length === 0, `sin advertencias de carga (${m3842.advertencias.join(' | ')})`);
const validados = new Set(readFileSync(path.join(DIR, '..', '..', 'verificador-titulos', 'fuentes', 'res-3842-2022-validados.txt'), 'utf8')
  .split(/\r?\n/).map((l) => l.split('#')[0].trim()).filter(Boolean));
assert(reglas3842.every((r) => r.estado === (validados.has(r.empleoId) ? 'VIGENTE' : 'REVISAR')),
  `las reglas salen en «revisar» salvo las de los empleos validados (${validados.size} validados)`);
const reglasTranscritas = reglas3842.filter((r) => !/018278/.test(r.fuente));
assert(reglasTranscritas.every((r) => /003842 de 2022, numeral [\d.]+, .+ítem .+\(hoja \d+\)$/.test(r.fuente)), 'cada regla transcrita cita numeral, ítem y hoja');
const derecho = reglas3842.filter((r) => /018278/.test(r.fuente));
assert(derecho.length === 1 && derecho[0].empleoId === 'DOC-CIENCIAS-SOCIALES' && derecho[0].valor === 'Derecho' && derecho[0].estado === 'REVISAR',
  'Resolución 018278 de 2023: Derecho para ciencias sociales, siempre en «revisar»');

// Para probar el cotejo, copias en memoria con todas las reglas en «vigente» o en «revisar».
const mVigente = manualDesdeTabla({ ...tablaManual, filas: tablaManual.filas.map((f) => ({ ...f, estado: /018278/.test(f.fuente) ? f.estado : 'vigente' })) });
const mRevisar = manualDesdeTabla({ ...tablaManual, filas: tablaManual.filas.map((f) => ({ ...f, estado: 'revisar' })) });
const sniesPrueba = CatalogoSnies.desdeTabla(await leerArchivoTabla('snies-3842.csv', [
  'CÓDIGO_INSTITUCIÓN;NOMBRE_INSTITUCIÓN;CÓDIGO_SNIES_DEL_PROGRAMA;NOMBRE_DEL_PROGRAMA;TÍTULO_OTORGADO;ESTADO_PROGRAMA;NIVEL_ACADÉMICO;NIVEL_DE_FORMACIÓN;ÁREA_DE_CONOCIMIENTO;NÚCLEO_BÁSICO_DEL_CONOCIMIENTO;CINE_F_2013_AC_CAMPO_AMPLIO',
  '9901;UNIVERSIDAD DE ENSAYO;99001;LICENCIATURA EN EDUCACIÓN BÁSICA CON ÉNFASIS EN EDUCACIÓN FÍSICA, RECREACIÓN Y DEPORTES;LICENCIADO EN EDUCACIÓN BÁSICA CON ÉNFASIS EN EDUCACIÓN FÍSICA, RECREACIÓN Y DEPORTES;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99002;LICENCIATURA EN MATEMÁTICAS Y FÍSICA;LICENCIADO EN MATEMÁTICAS Y FÍSICA;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99003;INGENIERÍA DE SISTEMAS;INGENIERO DE SISTEMAS;Activo;PREGRADO;Universitaria;Ingeniería, arquitectura, urbanismo y afines;Ingeniería de sistemas, telemática y afines;Ingeniería, industria y construcción',
  '9901;UNIVERSIDAD DE ENSAYO;99004;LICENCIATURA EN ESPAÑOL Y LENGUAS EXTRANJERAS;LICENCIADO EN ESPAÑOL Y LENGUAS EXTRANJERAS;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99005;DERECHO;ABOGADO;Activo;PREGRADO;Universitaria;Ciencias sociales y humanas;Derecho y afines;Ciencias sociales, periodismo e información',
  '9901;UNIVERSIDAD DE ENSAYO;99006;TECNOLOGÍA EN EDUCACIÓN PREESCOLAR;TECNÓLOGO EN EDUCACIÓN PREESCOLAR;Activo;PREGRADO;Tecnológica;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99007;LICENCIATURA EN PEDAGOGÍA INFANTIL;LICENCIADO EN PEDAGOGÍA INFANTIL;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
].join('\n')), ['codigo snies', 'programa']);
const ue = (programa: string) => t(programa, 'Universidad de Ensayo');
const dictamen = (empleo: string, titulo: TituloDeclarado, m = mVigente) => verificarAspirante(asp(empleo, titulo), m, sniesPrueba, P);
const casos3842: Array<[string, TituloDeclarado, string, string]> = [
  ['DOC-EDUCACION-FISICA', ue('Licenciatura en Educación Básica con Énfasis en Educación Física, Recreación y Deportes'), 'CUMPLE', 'énfasis en educación física → educación física (2.1.4.16)'],
  ['DOC-CIENCIAS-NATURALES', ue('Licenciatura en Educación Básica con Énfasis en Educación Física, Recreación y Deportes'), 'NO_CUMPLE', '«énfasis en educación física» no se confunde con «énfasis en física» (2.1.4.6)'],
  ['DOC-FISICA', ue('Licenciatura en Educación Básica con Énfasis en Educación Física, Recreación y Deportes'), 'NO_CUMPLE', '«educación física» no sirve para física (2.1.4.8)'],
  ['DOC-MATEMATICAS', ue('Licenciatura en Matemáticas y Física'), 'CUMPLE', 'licenciatura en matemáticas con otra opción → matemáticas (2.1.4.3)'],
  ['DOC-FISICA', ue('Licenciatura en Matemáticas y Física'), 'CUMPLE', 'licenciatura en matemáticas y física → física (2.1.4.8)'],
  ['DOC-TECNOLOGIA', ue('Ingeniería de Sistemas'), 'CUMPLE', 'ingeniería de sistemas → tecnología e informática (2.1.4.9)'],
  ['DOC-MATEMATICAS', ue('Ingeniería de Sistemas'), 'CUMPLE', '«Ingenierías» → cualquier ingeniería para matemáticas (2.1.4.3)'],
  ['DOC-FISICA', ue('Ingeniería de Sistemas'), 'NO_CUMPLE', 'ingeniería de sistemas no está en la lista de física (2.1.4.8)'],
  ['DOC-HUMANIDADES-CASTELLANA', ue('Licenciatura en Español y Lenguas Extranjeras'), 'CUMPLE', 'la errata «extrajeras» del manual no impide el cotejo (2.1.4.5)'],
  ['DOC-CIENCIAS-SOCIALES', ue('Derecho'), 'REVISION', 'Derecho para ciencias sociales → revisión humana (Resolución 018278 de 2023, ejecutoria sin acreditar)'],
  ['DOC-FILOSOFIA', ue('Derecho'), 'NO_CUMPLE', 'Derecho no sirve para filosofía'],
  ['DIR-RECTOR', ue('Derecho'), 'CUMPLE', 'rector: profesional no licenciado en cualquier área (1.2.2.1)'],
  ['DOC-PRIMARIA', ue('Tecnología en Educación Preescolar'), 'CUMPLE', 'tecnólogo del NBC Educación → primaria (2.1.4.2 y 3.1)'],
  ['DOC-MATEMATICAS', ue('Tecnología en Educación Preescolar'), 'NO_CUMPLE', 'tecnólogo en educación no sirve para matemáticas'],
  ['DOC-PREESCOLAR', ue('Licenciatura en Pedagogía Infantil'), 'CUMPLE', 'licenciatura en pedagogía con otra opción → preescolar (2.1.4.1)'],
  ['DOC-PREESCOLAR', t('Normalista Superior', 'Escuela Normal Superior de Ensayo'), 'CUMPLE', 'normalista superior → preescolar (2.1.4.1)'],
  ['DOC-MATEMATICAS', t('Normalista Superior', 'Escuela Normal Superior de Ensayo'), 'NO_CUMPLE', 'normalista superior no sirve para matemáticas'],
];
for (const [empleo, titulo, esperado, msg] of casos3842) {
  const r = dictamen(empleo, titulo);
  assert(r.resultado === esperado, `${msg} [${r.resultado}: ${r.titulos[0]?.motivos.join(' ')}]`);
}
d = dictamen('DOC-CIENCIAS-SOCIALES', ue('Derecho'));
assert(/018278/.test(d.titulos[0].motivos.join(' ')) && /ejecutoria/.test(d.titulos[0].motivos.join(' ')), 'el motivo de Derecho cita la Resolución 018278 y la ejecutoria');
d = dictamen('DOC-TECNOLOGIA', ue('Ingeniería de Sistemas'), mRevisar);
assert(d.resultado === 'REVISION' && /marcada para revisión/.test(d.titulos[0].motivos.join(' ')), 'con el manual sin validar, una coincidencia va a revisión humana');

console.log('\n▶ VA con las tablas del Anexo Técnico docentes 2026 (verificador-titulos/parametros/)');
const va26 = leerParametrosVA(readFileSync(path.join(DIR, '..', '..', 'verificador-titulos', 'parametros', 'parametros-va-docentes-2026.json'), 'utf8'));
assert(va26.tablas?.length === 5, `5 tablas: rector, coordinador, director rural, orientador y aula (${va26.tablas?.length})`);
const tablaDe = (id: string) => va26.tablas!.find((x) => x.empleos.includes(id) || x.empleos.some((e) => e.endsWith('*') && id.startsWith(e.slice(0, -1))))!;
assert(tablaDe('DOC-MATEMATICAS').numeral === '5.1.4' && tablaDe('DOC-ORIENTADOR').numeral === '5.1.5' && tablaDe('DIR-RECTOR').numeral === '5.1.1', 'cada empleo toma su tabla (el orientador no cae en la de aula)');
const sniesVA = CatalogoSnies.desdeTabla(await leerArchivoTabla('snies-va.csv', [
  'CÓDIGO_INSTITUCIÓN;NOMBRE_INSTITUCIÓN;CÓDIGO_SNIES_DEL_PROGRAMA;NOMBRE_DEL_PROGRAMA;TÍTULO_OTORGADO;ESTADO_PROGRAMA;NIVEL_ACADÉMICO;NIVEL_DE_FORMACIÓN;ÁREA_DE_CONOCIMIENTO;NÚCLEO_BÁSICO_DEL_CONOCIMIENTO;CINE_F_2013_AC_CAMPO_AMPLIO',
  '9901;UNIVERSIDAD DE ENSAYO;99101;LICENCIATURA EN MATEMÁTICAS;LICENCIADO EN MATEMÁTICAS;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99102;MAESTRÍA EN EDUCACIÓN;MAGÍSTER EN EDUCACIÓN;Activo;POSGRADO;Maestría;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99103;ESPECIALIZACIÓN EN ESTADÍSTICA APLICADA;ESPECIALISTA EN ESTADÍSTICA APLICADA;Activo;POSGRADO;Especialización;Matemáticas y ciencias naturales;Matemáticas, estadística y afines;Ciencias naturales, matemáticas y estadística',
  '9901;UNIVERSIDAD DE ENSAYO;99104;INGENIERÍA CIVIL;INGENIERO CIVIL;Activo;PREGRADO;Universitaria;Ingeniería, arquitectura, urbanismo y afines;Ingeniería civil y afines;Ingeniería, industria y construcción',
  '9901;UNIVERSIDAD DE ENSAYO;99105;LICENCIATURA EN CIENCIAS SOCIALES;LICENCIADO EN CIENCIAS SOCIALES;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99106;DOCTORADO EN EDUCACIÓN;DOCTOR EN EDUCACIÓN;Activo;POSGRADO;Doctorado;Ciencias de la educación;Educación;Educación',
  '9901;UNIVERSIDAD DE ENSAYO;99107;PSICOLOGÍA;PSICÓLOGO;Activo;PREGRADO;Universitaria;Ciencias sociales y humanas;Psicología;Salud y bienestar',
  '9901;UNIVERSIDAD DE ENSAYO;99108;LICENCIATURA EN PSICOPEDAGOGÍA;LICENCIADO EN PSICOPEDAGOGÍA;Activo;PREGRADO;Universitaria;Ciencias de la educación;Educación;Educación',
].join('\n')), ['codigo snies', 'programa']);
const vaDe = (empleo: string, ...programas: string[]) => {
  const dd = verificarAspirante(asp(empleo, ...programas.map(ue)), mVigente, sniesVA, P);
  return { dd, va: clasificarVA(dd, P.fechaCorte, va26) };
};
let r26 = vaDe('DOC-MATEMATICAS', 'Licenciatura en Matemáticas', 'Maestría en Educación', 'Especialización en Estadística Aplicada', 'Ingeniería Civil');
const pts = (i: number) => r26.va.titulos.find((x) => x.indice === i)!;
assert(r26.dd.resultado === 'CUMPLE' && pts(0).puntos === 5, 'aula: el requisito mínimo vale 5 puntos (factor 1)');
assert(pts(1).puntos === 18 && pts(1).relacion === 'PROBABLE', 'aula: maestría en educación → factor 2, 18 puntos');
assert(pts(2).puntos === 6 && /pasa al factor/.test(pts(2).motivo), 'aula: especialización en estadística → factor 3, 6 puntos, y el analista puede pasarla al 2');
assert(pts(3).puntos === 4, 'aula: ingeniería civil adicional → factor 3, 4 puntos');
assert(r26.va.puntajeProyectado === 5 + 18 + 10, `aula: 5 + 18 + (6 + 4) = 33 (proyectado ${r26.va.puntajeProyectado})`);
r26 = vaDe('DOC-MATEMATICAS', 'Licenciatura en Matemáticas', 'Licenciatura en Ciencias Sociales', 'Maestría en Educación', 'Doctorado en Educación');
assert(r26.va.puntajeProyectado === 5 + 25 && /tope del factor/.test(r26.va.titulos[2].motivo), `aula: factor 2 topado en 25 (10 + 18 + 25 → 25; proyectado ${r26.va.puntajeProyectado})`);
r26 = vaDe('DIR-COORDINADOR', 'Licenciatura en Matemáticas', 'Maestría en Educación', 'Ingeniería Civil');
assert(r26.va.puntajeProyectado === 5 + 18 + 1, `coordinador: 5 + 18 + 1 (tabla 5.1.2; proyectado ${r26.va.puntajeProyectado})`);
r26 = vaDe('DOC-ORIENTADOR', 'Licenciatura en Psicopedagogía', 'Psicología');
assert(r26.va.titulos[1].puntos === 10 && r26.va.titulos[1].relacion === 'PROBABLE', 'orientador: psicología adicional → factor 2, 10 puntos (5.1.5)');
r26 = vaDe('DOC-MATEMATICAS', 'Licenciatura en Matemáticas', 'Psicología');
assert(r26.va.titulos[1].puntos === 4, 'aula: psicología adicional → factor 3, 4 puntos');
assert(r26.va.advertencias.some((a) => /Saber Pro/.test(a)), 'advierte que Saber Pro, formación continua y experiencia no se calculan');

export const resultado = { fallos, corridas };
