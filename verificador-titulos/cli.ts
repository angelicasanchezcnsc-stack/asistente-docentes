/**
 * Verificación en lote desde la terminal (ver AYUDA). Se ejecuta con
 * `npm run verificar-titulos -- …`, que la empaqueta con esbuild (herramientas/verificar_titulos.mjs).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { CatalogoSnies } from './nucleo/snies';
import { manualDesdeJson, manualDesdeTabla } from './nucleo/manual';
import { aspirantesDesdeTabla, informeCsv, procesarLote, resumir } from './nucleo/lote';
import { leerArchivoTabla } from './nucleo/tabla';
import { leerFecha } from './nucleo/texto';
import { leerParametrosVA } from './nucleo/va';

const AYUDA = `Verificación de títulos docentes en lote.

  npm run verificar-titulos -- --snies programas-snies.xlsx --manual manual-funciones.csv --aspirantes aspirantes.csv --corte 15/12/2026 [--va parametros-va.json] [--salida informe.csv]

Escribe el informe (CSV para Excel) y un JSON con el detalle completo.`;

function argumentos(): Record<string, string> {
  const a: Record<string, string> = {};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    if (v[i].startsWith('--')) a[v[i].slice(2)] = v[i + 1] && !v[i + 1].startsWith('--') ? v[++i] : 'si';
  }
  return a;
}

async function tabla(ruta: string, pistas: string[] = []) {
  const datos = readFileSync(ruta);
  return leerArchivoTabla(ruta, new Uint8Array(datos), pistas);
}

async function main() {
  const a = argumentos();
  if (a.ayuda || !a.manual || !a.aspirantes) {
    console.log(AYUDA);
    process.exit(a.ayuda ? 0 : 1);
  }
  const corte = a.corte ? leerFecha(a.corte) : null;
  if (a.corte && !corte) throw new Error(`Fecha de corte ilegible: ${a.corte}`);
  if (!corte) console.warn('⚠️  Sin --corte: no se verificará que los títulos sean anteriores al cierre de inscripciones.');

  const snies = a.snies ? CatalogoSnies.desdeTabla(await tabla(a.snies, ['codigo snies', 'programa'])) : null;
  if (snies) {
    console.log(`SNIES: ${snies.programas.length} programas de ${snies.totalInstituciones} instituciones.`);
    const faltan = snies.columnasFaltantes();
    if (faltan.length) console.warn(`⚠️  Al SNIES le faltan columnas: ${faltan.join(', ')}.`);
  } else {
    console.warn('⚠️  Sin --snies: ningún título podrá dictaminarse «cumple» con certeza.');
  }

  const manual = /\.json$/i.test(a.manual)
    ? manualDesdeJson(readFileSync(a.manual, 'utf8'))
    : manualDesdeTabla(await tabla(a.manual, ['empleo', 'modo']));
  console.log(`Manual: ${manual.empleos.size} empleos.`);
  manual.advertencias.forEach((w) => console.warn(`⚠️  ${w}`));

  const va = a.va ? leerParametrosVA(readFileSync(a.va, 'utf8')) : null;
  const { aspirantes, errores } = aspirantesDesdeTabla(await tabla(a.aspirantes, ['inscripcion']));
  errores.forEach((e) => console.warn(`⚠️  Aspirantes, fila ${e.fila}: ${e.mensaje}`));

  const rs = procesarLote(aspirantes, manual, snies, { fechaCorte: corte }, va);
  const salida = a.salida || 'informe-verificacion-titulos.csv';
  writeFileSync(salida, informeCsv(rs));
  writeFileSync(salida.replace(/\.csv$/i, '') + '.json', JSON.stringify({
    generado: new Date().toISOString(),
    fechaCorte: corte,
    manual: { titulo: manual.titulo, version: manual.version },
    resultados: rs,
  }, null, 2));
  const r = resumir(rs);
  console.log(`\n${r.total} aspirantes: ${r.cumple} cumplen · ${r.noCumple} no cumplen · ${r.revision} a revisión humana.`);
  console.log(`Informe: ${salida}`);
}

main().catch((e) => {
  console.error(`❌ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
