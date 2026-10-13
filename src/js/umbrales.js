/* Umbrales del motor (fase 12). Todos se comparan con las medidas de Index.search (motor-busqueda.js):
   cov = proporción de grupos de palabras de la pregunta que aparecen; wcov = la misma proporción pesada por rareza (idf);
   s = puntaje BM25.
   - faqCov y faqWcov: una pregunta frecuente responde si cumple los dos.
   - pasajeWcov y pasajeS: un pasaje responde si cumple los dos; pasajeWcov también decide «Depende de su entidad».
   - especificidad: un texto que cambia por entidad pide la entidad si su wcov llega a este valor.
   - relacionadas: «Otras fuentes relacionadas»; parecidas: «Preguntas parecidas»; cercano: «Texto más cercano».
   UMBRALES_V06 son los de la v0.1 a la v0.6 y se conservan para comparar. UMBRALES son los que usa el asistente. */
export const UMBRALES_V06 = Object.freeze({
  faqCov: 0.66, faqWcov: 0.6, pasajeWcov: 0.6, pasajeS: 1, especificidad: 0.8, relacionadas: 0.5, parecidas: 0.5, cercano: 0.3
});

// 13 de octubre de 2026 (fase 12): la calibración con el banco de la consulta pública no encontró una configuración que
// respondiera más preguntas con la fuente esperada sin romper casos; la persona responsable decidió conservar estos valores.
export const UMBRALES = UMBRALES_V06;
