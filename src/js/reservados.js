/* Temas en reserva de Sala Plena (herramientas/temas_reservados.json): detecta la pregunta y decide qué pasajes
   se excluyen del índice. */
import { norm } from './motor-busqueda.js';

export const MENSAJE_RESERVADO = 'Este tema está en estudio. El valor de los derechos de participación y la forma de calcularlo se definirán en el acuerdo que apruebe la Sala Plena de la CNSC. Cuando se publique, este asistente mostrará el texto oficial.';

export function crearReservados(lista) {
  const temas = lista.map((t) => ({
    id: t.id,
    a: t.grupo_a.map(norm),
    b: t.grupo_b.map(norm),
    excluir: new RegExp(t.excluir_pasajes_con, 'i')
  }));
  // Palabra o frase completa: nunca como parte de otra palabra.
  const contiene = (texto, terminos) => terminos.some((t) => texto.includes(' ' + t + ' '));
  return {
    /** Tema reservado al que pertenece la pregunta (al menos un término de cada grupo), o null. */
    detectar(pregunta) {
      const n = ' ' + norm(pregunta) + ' ';
      return temas.find((t) => contiene(n, t.a) && contiene(n, t.b)) || null;
    },
    /** Verdadero si el texto del pasaje debe quedar fuera del índice y de las fuentes de las preguntas frecuentes. */
    excluir(texto) {
      return temas.some((t) => t.excluir.test(texto));
    }
  };
}
