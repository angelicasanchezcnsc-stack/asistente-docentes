/**
 * Lector ZIP mínimo para abrir archivos .xlsx sin dependencias.
 *
 * Usa `DecompressionStream('deflate-raw')`, que traen Chrome, Edge, Firefox, Safari y
 * Node 18 o posterior. Solo lee: entradas almacenadas (método 0) o comprimidas con
 * deflate (método 8), que es lo que produce Excel.
 */

export interface ArchivoZip {
  /** Nombre de la entrada → contenido descomprimido como texto UTF-8. */
  leerTexto(nombre: string): Promise<string | null>;
  nombres(): string[];
}

const FIRMA_FIN = 0x06054b50;
const FIRMA_CENTRAL = 0x02014b50;
const FIRMA_LOCAL = 0x04034b50;

interface Entrada {
  metodo: number;
  comprimido: number;
  desplazamientoLocal: number;
}

async function inflar(datos: Uint8Array): Promise<Uint8Array> {
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

export function abrirZip(entrada: ArrayBuffer | Uint8Array): ArchivoZip {
  const bytes = entrada instanceof Uint8Array ? entrada : new Uint8Array(entrada);
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Fin del directorio central: se busca desde el final (puede haber un comentario).
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (vista.getUint32(i, true) === FIRMA_FIN) { fin = i; break; }
  }
  if (fin < 0) throw new Error('El archivo no es un .xlsx válido (no se encontró la estructura ZIP).');

  const total = vista.getUint16(fin + 10, true);
  let p = vista.getUint32(fin + 16, true);
  const decodificador = new TextDecoder('utf-8');
  const entradas = new Map<string, Entrada>();
  for (let n = 0; n < total; n++) {
    if (vista.getUint32(p, true) !== FIRMA_CENTRAL) throw new Error('El directorio del .xlsx está dañado.');
    const metodo = vista.getUint16(p + 10, true);
    const comprimido = vista.getUint32(p + 20, true);
    const largoNombre = vista.getUint16(p + 28, true);
    const largoExtra = vista.getUint16(p + 30, true);
    const largoComentario = vista.getUint16(p + 32, true);
    const desplazamientoLocal = vista.getUint32(p + 42, true);
    const nombre = decodificador.decode(bytes.subarray(p + 46, p + 46 + largoNombre));
    entradas.set(nombre, { metodo, comprimido, desplazamientoLocal });
    p += 46 + largoNombre + largoExtra + largoComentario;
  }

  return {
    nombres: () => [...entradas.keys()],
    async leerTexto(nombre: string) {
      const e = entradas.get(nombre);
      if (!e) return null;
      const l = e.desplazamientoLocal;
      if (vista.getUint32(l, true) !== FIRMA_LOCAL) throw new Error(`La entrada «${nombre}» del .xlsx está dañada.`);
      const inicio = l + 30 + vista.getUint16(l + 26, true) + vista.getUint16(l + 28, true);
      const datos = bytes.subarray(inicio, inicio + e.comprimido);
      let salida: Uint8Array;
      if (e.metodo === 0) salida = datos;
      else if (e.metodo === 8) salida = await inflar(datos);
      else throw new Error(`El .xlsx usa una compresión no admitida (método ${e.metodo}).`);
      return decodificador.decode(salida);
    },
  };
}
