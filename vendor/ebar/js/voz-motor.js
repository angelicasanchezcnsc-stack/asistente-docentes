/**
 * Motor de lectura en voz alta, compartido por los botones «Escuchar» (lectura-voz.js) y
 * por el reproductor del panel de accesibilidad (panel-accesibilidad.js).
 *
 * No importa nada del formulario: el mismo archivo lo usa IncluIA, que lo carga desde
 * `/ebar/js/`. Las frases que dice se pueden sustituir con `configurarTextos`.
 *
 * Solo se usan voces instaladas en el equipo (`localService`). Las voces «en línea» de
 * los navegadores envían el texto a los servidores de su fabricante, y lo que se lee
 * incluye respuestas sobre discapacidad y barreras.
 *
 * Tablas: cada fila se lee como una frase que repite el encabezado de cada columna junto
 * a su dato («Fila 2, Técnico. Empleos abierto: 3. Vacantes abierto: 5.»), respetando
 * celdas combinadas y encabezados de varios niveles. Es la lectura de Lexible, que el
 * Despacho tomó como referencia. Las listas de definición se leen «Etiqueta: valor».
 */

const sintesis = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

/** Guion blando de corte por sílaba: la voz podría leerlo como una pausa. */
const GUION_BLANDO = '­';

/** Largo máximo de cada fragmento: Chrome corta las lecturas de más de unos 15 segundos. */
const LARGO_FRAGMENTO = 180;

export const VELOCIDADES = { lenta: 0.8, normal: 1, rapida: 1.25 };

let textos = {
  marcada: 'marcada',
  seleccionada: 'seleccionada',
  sinRespuesta: 'Sin respuesta.',
  respuestaEscrita: (valor) => `Respuesta: ${valor}`,
  opcionElegida: (valor) => `Opción elegida: ${valor}`,
  tabla: (titulo, filas, columnas) =>
    `${titulo ? `Tabla: ${titulo}. ` : 'Tabla. '}${filas} ${filas === 1 ? 'fila' : 'filas'} y ${columnas} ${columnas === 1 ? 'columna' : 'columnas'}.`,
  fila: (numero) => `Fila ${numero}`
};

/** Sustituye algunas de las frases anteriores (EBAR pasa las de su especificación). */
export function configurarTextos(propios = {}) {
  textos = { ...textos, ...propios };
}

/* ------------------------------------------------------------------ */
/* Voces                                                               */
/* ------------------------------------------------------------------ */

/** Orden de preferencia: Colombia, el resto de Hispanoamérica y, por último, España. */
function puntaje(voz) {
  const idioma = voz.lang.toLowerCase().replace('_', '-');
  if (idioma === 'es-co') return 0;
  if (idioma === 'es-es') return 2;
  return 1;
}

export function lecturaSoportada() {
  return Boolean(sintesis);
}

/** Voces locales en español, ordenadas según la preferencia. */
export function vocesDisponibles() {
  if (!sintesis) return [];
  return sintesis
    .getVoices()
    .filter((voz) => voz.localService && /^es([-_]|$)/i.test(voz.lang))
    .sort((a, b) => puntaje(a) - puntaje(b) || a.name.localeCompare(b.name, 'es'));
}

export function hayVoz() {
  return vocesDisponibles().length > 0;
}

export function vozPreferida(uri) {
  const voces = vocesDisponibles();
  return voces.find((voz) => voz.voiceURI === uri) || voces[0] || null;
}

/** Avisa cuando el navegador termina de cargar las voces, que en varios llegan tarde. */
export function alCambiarVoces(funcion) {
  sintesis?.addEventListener?.('voiceschanged', funcion);
}

/* ------------------------------------------------------------------ */
/* Texto legible                                                       */
/* ------------------------------------------------------------------ */

export function visible(nodo) {
  if (nodo.hidden || nodo.getAttribute('aria-hidden') === 'true') return false;
  if (nodo.closest('[hidden], [aria-hidden="true"]')) return false;
  return (
    nodo.getClientRects().length > 0 ||
    nodo.classList.contains('solo-lector-pantalla') ||
    nodo.classList.contains('sr-only')
  );
}

/**
 * Ajustes de pronunciación. Se limitan a lo que una voz lee mal sin ambigüedad: «N/A»,
 * el signo de porcentaje y «N.º» o «No.» seguidos de un número. «No.» solo, al final de
 * una respuesta, es la palabra «no» y se deja como está.
 */
export function humanizar(texto) {
  return String(texto ?? '')
    .replaceAll(GUION_BLANDO, '')
    .replace(/\bN\/A\b/gi, 'no aplica')
    .replace(/\bN\.?\s?[º°]\s*(?=\d)/g, 'número ')
    .replace(/\bNo\.\s*(?=\d)/g, 'número ')
    .replace(/(\d)\s*%/g, '$1 por ciento')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texto visible de un nodo, sin lo decorativo (aria-hidden) ni los botones de lectura. */
export function textoDe(nodo) {
  if (!nodo) return '';
  const copia = nodo.cloneNode(true);
  for (const oculto of copia.querySelectorAll('[aria-hidden="true"], .lectura-voz__boton, [data-a11y-omitir]')) {
    oculto.remove();
  }
  return humanizar(copia.textContent);
}

/* ---------- Tablas ---------- */

/** Cuadrícula de la tabla: cada posición apunta a su celda, también las combinadas. */
export function cuadricula(tabla) {
  const filas = Array.from(tabla.rows);
  const salida = filas.map(() => []);
  filas.forEach((fila, r) => {
    let columna = 0;
    for (const celda of fila.cells) {
      while (salida[r][columna]) columna++;
      const altoFilas = Math.max(1, parseInt(celda.getAttribute('rowspan') || '1', 10) || 1);
      const anchoColumnas = Math.max(1, parseInt(celda.getAttribute('colspan') || '1', 10) || 1);
      for (let i = 0; i < altoFilas; i++) {
        for (let j = 0; j < anchoColumnas; j++) {
          if (salida[r + i]) salida[r + i][columna + j] = celda;
        }
      }
      columna += anchoColumnas;
    }
  });
  return salida;
}

function esEncabezadoDeColumna(celda) {
  if (celda.tagName !== 'TH') return celda.closest('thead') !== null;
  const ambito = celda.getAttribute('scope');
  return ambito !== 'row' && ambito !== 'rowgroup';
}

function esEncabezadoDeFila(celda) {
  if (celda.tagName !== 'TH') return false;
  const ambito = celda.getAttribute('scope');
  return ambito === 'row' || ambito === 'rowgroup' || (!ambito && celda.closest('tbody, tfoot') !== null);
}

/** Encabezados de una columna, de arriba abajo, sin repetir el mismo texto. */
function encabezadosDeColumna(grilla, columna, filaActual) {
  const encabezados = [];
  for (let r = 0; r < filaActual; r++) {
    const celda = grilla[r]?.[columna];
    if (!celda || !esEncabezadoDeColumna(celda)) continue;
    const texto = textoDe(celda);
    if (texto && encabezados.at(-1) !== texto) encabezados.push(texto);
  }
  // Con dos niveles, un encabezado inferior largo ya se explica solo: no se antepone el
  // superior para no alargar cada dato (misma regla que Lexible).
  if (encabezados.length > 1 && encabezados.at(-1).length > 30) return encabezados.at(-1);
  return encabezados.join(' ');
}

/** Cantidad de filas de encabezado: las de `thead` o, sin él, las que solo tienen `th` de columna. */
function filasDeEncabezado(tabla) {
  if (tabla.tHead) return tabla.tHead.rows.length;
  let cuenta = 0;
  for (const fila of tabla.rows) {
    const celdas = Array.from(fila.cells);
    if (celdas.length > 0 && celdas.every((c) => c.tagName === 'TH' && esEncabezadoDeColumna(c))) cuenta++;
    else break;
  }
  return cuenta;
}

/** Frase de una fila de datos con el encabezado de cada columna junto a su dato. */
export function frasesDeFila(fila) {
  const tabla = fila.closest('table');
  if (!tabla) return [];
  const grilla = cuadricula(tabla);
  const r = fila.rowIndex;
  const encabezado = filasDeEncabezado(tabla);
  if (r < encabezado) return [];

  const celdas = grilla[r] ?? [];
  const deFila = celdas.find((c) => c && esEncabezadoDeFila(c));
  const partes = [];
  const titulo = deFila ? textoDe(deFila) : '';
  partes.push(`${textos.fila(r - encabezado + 1)}${titulo ? `, ${titulo}` : ''}.`);

  celdas.forEach((celda, c) => {
    if (!celda || celda === deFila) return;
    if (c > 0 && celdas[c - 1] === celda) return; // celda combinada: una sola vez
    const valor = textoDe(celda);
    if (!valor || valor === '.') return;
    const nombre = encabezadosDeColumna(grilla, c, r);
    partes.push(nombre ? `${nombre}: ${valor}.` : `${valor}.`);
  });
  return partes;
}

/** Presentación de la tabla: su título y su tamaño. */
export function fraseDeTabla(tabla) {
  const titulo = tabla.caption ? textoDe(tabla.caption) : tabla.getAttribute('aria-label') || '';
  const encabezado = filasDeEncabezado(tabla);
  const filas = Math.max(0, tabla.rows.length - encabezado);
  const columnas = Math.max(0, ...cuadricula(tabla).map((f) => f.length));
  return textos.tabla(humanizar(titulo), filas, columnas);
}

/* ---------- Bloques ---------- */

function estadoDeOpcion(control) {
  if (control.type === 'radio') return control.checked ? textos.seleccionada : '';
  return control.checked ? textos.marcada : '';
}

function valorDeControl(control) {
  if (control.tagName === 'SELECT') {
    const elegida = control.selectedOptions[0];
    return elegida && elegida.value !== '' ? textos.opcionElegida(elegida.textContent.trim()) : textos.sinRespuesta;
  }
  const valor = control.value.trim();
  return valor ? textos.respuestaEscrita(valor) : textos.sinRespuesta;
}

/**
 * Recorre el bloque en el orden del documento y lo convierte en frases. Omite lo que no
 * se ve, los botones de lectura y los demás botones de acción. Las tablas se leen fila a
 * fila con sus encabezados; las listas de definición, como «Etiqueta: valor».
 *
 * `omitido` permite al llamador decidir qué nodos no se leen (un desplegable cerrado se
 * lee completo aunque su contenido no se vea).
 */
export function frasesDe(bloque, { omitido = (nodo) => !visible(nodo) } = {}) {
  if (bloque.tagName === 'TR') return frasesDeFila(bloque);
  if (bloque.tagName === 'CAPTION') return [fraseDeTabla(bloque.closest('table'))];

  const frases = [];
  let actual = '';

  const cerrar = () => {
    const texto = humanizar(actual);
    if (texto) frases.push(/[.:;?!»)]$/.test(texto) ? texto : `${texto}.`);
    actual = '';
  };

  const recorrer = (nodo) => {
    if (nodo.nodeType === Node.TEXT_NODE) {
      actual += nodo.textContent;
      return;
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE || omitido(nodo)) return;
    if (nodo.classList.contains('lectura-voz__boton') || nodo.hasAttribute('data-a11y-omitir')) return;
    // Los botones de acción («Siguiente», «Modificar») llevan la clase «boton» y no son
    // contenido. Los términos del glosario también son botones, pero forman parte de la
    // frase: sin ellos se leería «las condiciones generales de o se remitirá».
    if (nodo.tagName === 'BUTTON' && nodo.classList.contains('boton')) return;
    if (['SCRIPT', 'STYLE', 'OPTION', 'SVG', 'svg', 'TEMPLATE'].includes(nodo.tagName)) return;

    if (nodo.matches('input[type="checkbox"], input[type="radio"]')) return;
    if (nodo.matches('input:not([type="hidden"]), textarea, select')) {
      cerrar();
      frases.push(valorDeControl(nodo));
      return;
    }

    if (nodo.tagName === 'TABLE') {
      cerrar();
      frases.push(fraseDeTabla(nodo));
      for (const fila of nodo.rows) frases.push(...frasesDeFila(fila));
      return;
    }

    if (nodo.tagName === 'DL') {
      cerrar();
      let etiqueta = '';
      for (const hijo of nodo.querySelectorAll(':scope > dt, :scope > dd, :scope > div > dt, :scope > div > dd')) {
        if (omitido(hijo)) continue;
        if (hijo.tagName === 'DT') etiqueta = textoDe(hijo);
        else {
          const valor = textoDe(hijo);
          if (valor) frases.push(etiqueta ? `${etiqueta}: ${valor}${/[.:;?!»)]$/.test(valor) ? '' : '.'}` : valor);
        }
      }
      return;
    }

    // Solo los elementos de bloque cortan la frase; un término con estilo «inline-block»
    // sigue siendo parte de la oración.
    const pantalla = getComputedStyle(nodo).display;
    const esBloque = !pantalla.startsWith('inline') && pantalla !== 'contents';
    if (esBloque) cerrar();
    for (const hijo of nodo.childNodes) recorrer(hijo);

    if (nodo.tagName === 'LABEL' && nodo.htmlFor) {
      const control = document.getElementById(nodo.htmlFor);
      if (control?.matches('input[type="checkbox"], input[type="radio"]')) {
        const estado = estadoDeOpcion(control);
        if (estado) actual += `, ${estado}`;
      }
    }
    if (esBloque) cerrar();
  };

  recorrer(bloque);
  cerrar();
  return frases;
}

/** Parte las frases largas por comas o espacios para que ningún fragmento se corte. */
export function fragmentos(frases) {
  const salida = [];
  for (const frase of frases) {
    let resto = frase;
    while (resto.length > LARGO_FRAGMENTO) {
      const corte =
        Math.max(resto.lastIndexOf(', ', LARGO_FRAGMENTO), resto.lastIndexOf('; ', LARGO_FRAGMENTO)) + 1 ||
        resto.lastIndexOf(' ', LARGO_FRAGMENTO);
      const posicion = corte > 40 ? corte : LARGO_FRAGMENTO;
      salida.push(resto.slice(0, posicion).trim());
      resto = resto.slice(posicion).trim();
    }
    if (resto) salida.push(resto);
  }
  return salida;
}

/* ------------------------------------------------------------------ */
/* Reproducción                                                        */
/* ------------------------------------------------------------------ */

let turno = 0;

/**
 * Lee una lista de fragmentos con la voz y la velocidad indicadas. Devuelve una función
 * que la detiene. `alTerminar` solo se llama si la lectura llega al final por sí misma:
 * `cancel()` dispara después, sin esperar, el fin o el error de los fragmentos anulados,
 * y por eso cada lectura lleva su propio turno.
 */
export function hablar(partes, { voz, velocidad = 'normal', alTerminar = () => {} } = {}) {
  const elegida = vozPreferida(voz);
  if (!sintesis || !elegida || partes.length === 0) {
    alTerminar();
    return () => {};
  }
  sintesis.cancel();
  const mio = ++turno;

  partes.forEach((texto, indice) => {
    const enunciado = new SpeechSynthesisUtterance(texto);
    enunciado.voice = elegida;
    enunciado.lang = elegida.lang;
    enunciado.rate = VELOCIDADES[velocidad] ?? 1;
    if (indice === partes.length - 1) {
      enunciado.onend = () => {
        if (turno === mio) alTerminar();
      };
    }
    enunciado.onerror = (evento) => {
      if (turno === mio && evento.error !== 'interrupted' && evento.error !== 'canceled') alTerminar();
    };
    sintesis.speak(enunciado);
  });

  return () => {
    if (turno === mio) turno++;
    sintesis.cancel();
  };
}

/** Detiene cualquier lectura en curso, venga de donde venga. */
export function callar() {
  turno++;
  sintesis?.cancel();
}
