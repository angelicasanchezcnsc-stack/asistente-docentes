// Ejecuta verificador-titulos/cli.ts: lo empaqueta con esbuild en un archivo temporal y lo corre
// con los mismos argumentos. Uso: npm run verificar-titulos -- --ayuda
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = mkdtempSync(path.join(tmpdir(), 'verificador-'));
const salida = path.join(dir, 'cli.mjs');
try {
  await build({
    entryPoints: [path.join(raiz, 'verificador-titulos', 'cli.ts')],
    bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile: salida, logLevel: 'warning',
  });
  await import(pathToFileURL(salida).href);
} finally {
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
}
