/**
 * Panel de herramientas de accesibilidad en el formato de Lexible: un botón flotante que
 * abre un panel lateral con un reproductor de lectura en voz alta arriba y una cuadrícula
 * de opciones de presentación debajo.
 *
 * Es común a EBAR e IncluIA. No conoce los estilos de ninguna de las dos: guarda el
 * estado, dibuja el panel, publica cada opción como atributo `data-a11y-*` en <html> y
 * llama a `aplicar(estado)` para que cada aplicación traduzca el estado a sus propias
 * variantes de presentación (los temas oscuro y de alto contraste son variantes definidas
 * expresamente por cada aplicación, nunca una inversión automática de colores).
 *
 * Decisiones de accesibilidad del propio panel:
 * - Es una región desplegable, no un diálogo: la página sigue disponible mientras se
 *   escucha y el foco no queda atrapado. Escape la cierra y el foco vuelve al botón que la
 *   abrió. Cerrada, está `hidden` y no ocupa paradas de tabulación.
 * - Cada opción binaria es un botón con `aria-pressed`; las de varios niveles dicen su
 *   nivel en el propio texto del botón. El estado nunca depende solo del color.
 * - Con `anunciar: true`, una región viva cortés anuncia los cambios de opción y de
 *   reproducción. EBAR la desactiva porque reserva las regiones vivas para los mensajes
 *   del Anexo A.9; ahí el estado lo comunican `aria-pressed` y el texto de cada botón, y
 *   el tamaño del texto, su valor con `role="status"` como en el panel anterior. El
 *   avance bloque a bloque nunca se anuncia: competiría con la propia voz.
 * - Solo voces instaladas en el equipo (ver voz-motor.js).
 * - La lectura no se activa con un clic sobre el texto, como en Lexible: eso convertiría
 *   cada párrafo en un control y entorpecería a quien navega con lector de pantalla. El
 *   reproductor empieza donde está el foco o en lo primero que se ve en pantalla.
 */

import {
  alCambiarVoces,
  callar,
  fragmentos,
  frasesDe as frasesDelMotor,
  hablar,
  hayVoz,
  lecturaSoportada,
  vocesDisponibles,
  visible
} from './voz-motor.js';

const ESCALAS = [100, 125, 150, 175, 200];
const VELOCIDADES = ['lenta', 'normal', 'rapida'];
const CONTRASTES = ['normal', 'oscuro', 'alto', 'alto-oscuro'];

export const PREDETERMINADO = {
  version: 1,
  contraste: 'normal',
  texto: 100,
  espaciado: 0,
  interlineado: 0,
  tipografia: false,
  dislexia: false,
  facilitado: false,
  enlaces: false,
  animaciones: false,
  cursor: false,
  pregunta: false,
  guia: false,
  foco: false,
  objetivos: false,
  botonesEscuchar: false,
  voz: '',
  velocidad: 'normal'
};

const TEXTOS = {
  titulo: 'Herramientas de accesibilidad',
  abrir: 'Herramientas de accesibilidad',
  cerrar: 'Cerrar las herramientas de accesibilidad',
  atajo: 'Atajo de teclado: Alt + A abre y cierra este panel.',
  lecturaTitulo: 'Lectura en voz alta',
  lecturaListo: 'Pulse «Reproducir» para escuchar la página desde donde está.',
  lecturaLeyendo: (n, total) => `Leyendo ${n} de ${total}`,
  lecturaPausa: (n, total) => `En pausa en ${n} de ${total}`,
  lecturaFin: 'Lectura terminada.',
  sinVoz:
    'Este equipo no tiene instalada una voz en español. En Windows puede agregarla en Configuración, Hora e idioma, Voz; en Android y en iPhone, en los ajustes de accesibilidad o de texto a voz. Después vuelva a abrir esta página.',
  sinSoporte: 'Este navegador no permite la lectura en voz alta.',
  privacidadVoz: 'Solo se usan voces instaladas en este equipo: lo que se lee no sale de él.',
  anterior: 'Anterior',
  reproducir: 'Reproducir',
  reanudar: 'Reanudar',
  pausar: 'Pausar',
  detener: 'Detener',
  siguiente: 'Siguiente',
  velocidad: 'Velocidad',
  velocidades: { lenta: 'Lenta', normal: 'Normal', rapida: 'Rápida' },
  voz: 'Voz',
  botonesEscuchar: 'Botón «Escuchar» en cada pregunta',
  presentacionTitulo: 'Presentación',
  tamano: 'Tamaño del texto',
  reducir: 'Reducir',
  aumentar: 'Aumentar',
  tamanoMinimo: 'Es el tamaño mínimo disponible.',
  tamanoMaximo: 'Es el tamaño máximo disponible.',
  restablecer: 'Restablecer todo',
  restablecido: 'Se restableció la presentación predeterminada.',
  activado: 'activado',
  desactivado: 'desactivado',
  niveles: ['Normal', 'Amplio', 'Muy amplio'],
  contrastes: {
    normal: 'Normal',
    oscuro: 'Tema oscuro',
    alto: 'Alto contraste',
    'alto-oscuro': 'Alto contraste oscuro'
  },
  opciones: {
    contraste: 'Contraste',
    espaciado: 'Espaciado del texto',
    interlineado: 'Altura de línea',
    tipografia: 'Tipografía legible',
    dislexia: 'Fuente para dislexia',
    facilitado: 'Lectura facilitada',
    enlaces: 'Resaltar enlaces',
    animaciones: 'Detener animaciones',
    cursor: 'Cursor grande',
    pregunta: 'Resaltar la pregunta actual',
    guia: 'Guía de lectura',
    foco: 'Foco reforzado',
    objetivos: 'Áreas de clic amplias'
  }
};

/* Iconos: trazos sencillos, decorativos (aria-hidden). */
const ICONOS = {
  contraste: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor"/>',
  espaciado: '<path d="M4 7h16M4 12h16M4 17h16"/><path d="M2 4v16M22 4v16"/>',
  interlineado: '<path d="M10 6h11M10 12h11M10 18h11"/><path d="M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2"/>',
  tipografia: '<path d="M4 20 10 4h1l6 16M6.5 14h8"/><path d="M18 9v11"/>',
  dislexia: '<path d="M4 5h4a5 5 0 0 1 0 10H4z"/><path d="M15 9l3 6 3-6M18 15l-2 5"/>',
  facilitado: '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/><path d="M6 9h3M6 12h3M15 9h3M15 12h3"/>',
  enlaces: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  animaciones: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  cursor: '<path d="M5 3l14 8-6 2-2 6z"/>',
  pregunta: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M7 14h6"/>',
  guia: '<path d="M3 12h18"/><path d="M3 8h18M3 16h18" opacity=".35"/>',
  foco: '<rect x="4" y="4" width="16" height="16" rx="3"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  objetivos: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  anterior: '<path d="M6 5v14M19 5 9 12l10 7z" fill="currentColor"/>',
  reproducir: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  pausar: '<path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/>',
  detener: '<rect x="6" y="6" width="12" height="12" fill="currentColor"/>',
  siguiente: '<path d="M18 5v14M5 5l10 7-10 7z" fill="currentColor"/>',
  restablecer: '<path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/>',
  accesibilidad:
    '<circle cx="12" cy="4.5" r="2" fill="currentColor"/><path d="M4 8.5c2.6.8 5.3 1.2 8 1.2s5.4-.4 8-1.2M12 9.7V15m0 0-3.5 6.5M12 15l3.5 6.5"/>'
};

function icono(nombre, clase = 'a11y-icono') {
  return `<svg class="${clase}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre] ?? ''}</svg>`;
}

function crear(etiqueta, atributos = {}, html = '') {
  const nodo = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === false || valor === null || valor === undefined) continue;
    if (nombre === 'clase') nodo.className = valor;
    else if (nombre === 'texto') nodo.textContent = valor;
    else nodo.setAttribute(nombre, valor === true ? '' : String(valor));
  }
  if (html) nodo.innerHTML = html;
  return nodo;
}

/* ------------------------------------------------------------------ */
/* Estado                                                              */
/* ------------------------------------------------------------------ */

function sanear(guardado) {
  const estado = { ...PREDETERMINADO };
  if (!guardado || typeof guardado !== 'object') return estado;
  for (const [clave, base] of Object.entries(PREDETERMINADO)) {
    const valor = guardado[clave];
    if (typeof valor === typeof base) estado[clave] = valor;
  }
  if (!CONTRASTES.includes(estado.contraste)) estado.contraste = 'normal';
  if (!ESCALAS.includes(estado.texto)) estado.texto = ESCALAS.reduce((a, b) => (Math.abs(b - estado.texto) < Math.abs(a - estado.texto) ? b : a));
  estado.espaciado = Math.min(2, Math.max(0, Math.round(estado.espaciado)));
  estado.interlineado = Math.min(2, Math.max(0, Math.round(estado.interlineado)));
  if (!VELOCIDADES.includes(estado.velocidad)) estado.velocidad = 'normal';
  return estado;
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/**
 * @param {object} config
 * @param {string}   config.clave           Clave de almacenamiento (la comparten EBAR e IncluIA).
 * @param {Function} [config.migrar]        Estado parcial desde preferencias anteriores, si no hay guardado.
 * @param {string[]} config.opciones        Mosaicos que se muestran, en orden.
 * @param {Function} config.aplicar         Traduce el estado a la presentación de la aplicación.
 * @param {Function} config.contenedorLectura  Devuelve el elemento que se lee.
 * @param {string}   [config.unidades]      Selector de los bloques que lee el reproductor.
 * @param {boolean}  [config.bloquesSueltos] Lee también divisiones con texto propio (interfaces sin párrafos).
 * @param {Function} [config.frases]        Frases de un bloque (EBAR lee completos sus desplegables).
 * @param {boolean}  [config.conBotonesEscuchar] Muestra la opción de los botones «Escuchar».
 * @param {HTMLElement[]} [config.disparadores] Botones existentes que también abren el panel.
 * @param {string}   [config.logo]          Imagen del botón flotante (o <meta name="accesibilidad-logo">);
 *                                          sin ella, el símbolo de accesibilidad dibujado.
 * @param {object}   [config.textos]        Sustituye textos del panel.
 * @param {boolean}  [config.anunciar=true] Anuncia los cambios con una región viva cortés.
 * @param {string[]} [config.contrastes]    Estados de contraste que recorre el mosaico, si la aplicación
 *                                          no tiene los cuatro. Un estado guardado por otra aplicación
 *                                          se respeta; el siguiente clic vuelve al ciclo propio.
 */
export function iniciarPanelAccesibilidad(config) {
  const textos = { ...TEXTOS, ...(config.textos || {}), opciones: { ...TEXTOS.opciones, ...(config.textos?.opciones || {}) } };
  const unidadesSelector =
    config.unidades ||
    '.campo, .aviso, h1, h2, h3, h4, h5, h6, p, li, dl, caption, tr, blockquote, legend, figcaption';
  const frases = config.frases || ((bloque) => frasesDelMotor(bloque));
  const contrastes = config.contrastes || CONTRASTES;

  /* ---------- Estado y almacenamiento ---------- */

  let estado;
  try {
    const guardado = window.localStorage.getItem(config.clave);
    if (guardado) estado = sanear(JSON.parse(guardado));
    else {
      const migrado = config.migrar?.();
      estado = sanear({ ...PREDETERMINADO, ...(migrado || {}) });
      // Lo migrado queda en la clave nueva desde ya.
      if (migrado) window.localStorage.setItem(config.clave, JSON.stringify(estado));
    }
  } catch {
    // Almacenamiento bloqueado: la página funciona igual, sin recordar la elección.
    estado = sanear(config.migrar?.() || {});
  }

  const guardar = () => {
    try {
      window.localStorage.setItem(config.clave, JSON.stringify(estado));
    } catch {
      /* sin almacenamiento disponible */
    }
  };

  const aplicar = () => {
    const raiz = document.documentElement;
    const si = (valor) => (valor ? 'si' : 'no');
    raiz.dataset.a11yContraste = estado.contraste;
    raiz.dataset.a11yTexto = String(estado.texto);
    raiz.dataset.a11yEspaciado = String(estado.espaciado);
    raiz.dataset.a11yInterlineado = String(estado.interlineado);
    raiz.dataset.a11yTipografia = si(estado.tipografia);
    raiz.dataset.a11yDislexia = si(estado.dislexia);
    raiz.dataset.a11yFacilitado = si(estado.facilitado);
    raiz.dataset.a11yEnlaces = si(estado.enlaces);
    raiz.dataset.a11yAnimaciones = si(estado.animaciones);
    raiz.dataset.a11yCursor = si(estado.cursor);
    raiz.dataset.a11yPregunta = si(estado.pregunta);
    raiz.dataset.a11yFoco = si(estado.foco);
    raiz.dataset.a11yObjetivos = si(estado.objetivos);
    raiz.style.setProperty('--a11y-escala', String(estado.texto / 100));
    actualizarGuia();
    config.aplicar?.({ ...estado });
  };

  /* ---------- Guía de lectura (franja que sigue al puntero) ---------- */

  let guia = null;
  const moverGuia = (evento) => {
    if (guia) guia.style.top = `${evento.clientY - 16}px`;
  };
  function actualizarGuia() {
    if (estado.guia && !guia) {
      guia = crear('div', { id: 'a11y-guia', clase: 'a11y-guia', 'aria-hidden': 'true' });
      document.body.append(guia);
      document.addEventListener('pointermove', moverGuia);
    } else if (!estado.guia && guia) {
      document.removeEventListener('pointermove', moverGuia);
      guia.remove();
      guia = null;
    }
  }

  /* ---------- Estructura ---------- */

  // El logo puede venir de la configuración o de la página que monta el panel: la copia del
  // EBAR dentro de IncluIA usa el símbolo de accesibilidad de la ONU sin cambiar este código.
  const logo = config.logo || document.querySelector('meta[name="accesibilidad-logo"]')?.content || '';
  const disparador = crear(
    'button',
    {
      type: 'button',
      clase: `a11y-disparador no-imprimir${logo ? ' a11y-disparador--logo' : ''}`,
      'aria-expanded': 'false',
      'aria-controls': 'a11y-panel',
      'aria-keyshortcuts': 'Alt+A',
      title: `${textos.abrir} (Alt + A)`
    },
    logo
      ? '<span class="a11y-disparador__nucleo" aria-hidden="true"><img alt="" class="a11y-disparador__imagen"></span>'
      : icono('accesibilidad', 'a11y-disparador__icono')
  );
  // La dirección se asigna como propiedad para no interpretarla como HTML.
  if (logo) disparador.querySelector('img').src = logo;
  disparador.append(crear('span', { clase: 'a11y-solo-lector', texto: textos.abrir }));

  const panel = crear('div', {
    id: 'a11y-panel',
    clase: 'a11y-panel no-imprimir',
    role: 'region',
    'aria-labelledby': 'a11y-titulo',
    hidden: true
  });

  const cabecera = crear('div', { clase: 'a11y-panel__cabecera' });
  cabecera.append(
    crear('h2', { id: 'a11y-titulo', clase: 'a11y-panel__titulo' }, `${icono('accesibilidad')}<span>${textos.titulo}</span>`)
  );
  const botonCerrar = crear('button', { type: 'button', clase: 'a11y-cerrar', 'aria-label': textos.cerrar }, '<span aria-hidden="true">×</span>');
  cabecera.append(botonCerrar);

  const cuerpo = crear('div', { clase: 'a11y-panel__cuerpo' });
  const conAnuncios = config.anunciar !== false;
  const anuncio = conAnuncios
    ? crear('p', { clase: 'a11y-solo-lector', 'aria-live': 'polite', 'aria-atomic': 'true' })
    : crear('span', { hidden: true });
  const anunciar = (mensaje) => {
    if (!conAnuncios) return;
    anuncio.textContent = '';
    setTimeout(() => {
      anuncio.textContent = mensaje;
    }, 60);
  };

  /* ---------- Reproductor ---------- */

  const reproductor = crear('section', { clase: 'a11y-reproductor', 'aria-labelledby': 'a11y-lectura-titulo' });
  reproductor.append(crear('h3', { id: 'a11y-lectura-titulo', clase: 'a11y-reproductor__titulo', texto: textos.lecturaTitulo }));
  const estadoLectura = crear('p', { clase: 'a11y-reproductor__estado', id: 'a11y-lectura-estado' });
  const progreso = crear('div', { clase: 'a11y-progreso', 'aria-hidden': 'true' }, '<div class="a11y-progreso__barra"></div>');
  const controles = crear('div', { clase: 'a11y-reproductor__controles', role: 'group', 'aria-label': textos.lecturaTitulo });

  const botonControl = (nombre, etiqueta, clase = '') => {
    const boton = crear('button', { type: 'button', clase: `a11y-control ${clase}`.trim(), 'aria-describedby': 'a11y-lectura-estado' }, icono(nombre));
    boton.append(crear('span', { clase: 'a11y-control__texto', texto: etiqueta }));
    return boton;
  };
  const bAnterior = botonControl('anterior', textos.anterior);
  const bReproducir = botonControl('reproducir', textos.reproducir, 'a11y-control--principal');
  const bDetener = botonControl('detener', textos.detener);
  const bSiguiente = botonControl('siguiente', textos.siguiente);
  const bVelocidad = crear('button', { type: 'button', clase: 'a11y-control a11y-control--velocidad' });
  controles.append(bAnterior, bReproducir, bDetener, bSiguiente, bVelocidad);

  const eleccionVoz = crear('div', { clase: 'a11y-reproductor__voz' });
  const listaVoces = crear('select', { id: 'a11y-voz' });
  eleccionVoz.append(crear('label', { for: 'a11y-voz', texto: textos.voz }), listaVoces);
  const notaVoz = crear('p', { clase: 'a11y-reproductor__nota' });

  reproductor.append(estadoLectura, progreso, controles, eleccionVoz, notaVoz);

  let interruptorEscuchar = null;
  if (config.conBotonesEscuchar) {
    interruptorEscuchar = crear('button', { type: 'button', clase: 'a11y-interruptor', 'aria-pressed': 'false' });
    interruptorEscuchar.append(
      crear('span', { clase: 'a11y-interruptor__texto', texto: textos.botonesEscuchar }),
      crear('span', { clase: 'a11y-interruptor__estado', 'aria-hidden': 'true' })
    );
    reproductor.append(interruptorEscuchar);
  }

  /* ---------- Presentación ---------- */

  const presentacion = crear('section', { clase: 'a11y-presentacion', 'aria-labelledby': 'a11y-presentacion-titulo' });
  presentacion.append(crear('h3', { id: 'a11y-presentacion-titulo', clase: 'a11y-reproductor__titulo', texto: textos.presentacionTitulo }));

  // Tamaño del texto: dos botones y el valor, porque el numeral 7 pide aumentar y reducir.
  const tamano = crear('div', { clase: 'a11y-tamano', role: 'group', 'aria-labelledby': 'a11y-tamano-titulo' });
  const valorTamano = crear('span', { clase: 'a11y-tamano__valor', id: 'a11y-tamano-valor', role: conAnuncios ? null : 'status' });
  const bReducir = crear('button', { type: 'button', clase: 'a11y-tamano__boton', 'aria-describedby': 'a11y-tamano-valor' }, '<span aria-hidden="true">A−</span>');
  bReducir.append(crear('span', { clase: 'a11y-tamano__accion', texto: textos.reducir }));
  const bAumentar = crear('button', { type: 'button', clase: 'a11y-tamano__boton', 'aria-describedby': 'a11y-tamano-valor' }, '<span aria-hidden="true">A+</span>');
  bAumentar.append(crear('span', { clase: 'a11y-tamano__accion', texto: textos.aumentar }));
  tamano.append(crear('span', { id: 'a11y-tamano-titulo', clase: 'a11y-tamano__titulo', texto: textos.tamano }), bReducir, valorTamano, bAumentar);

  const cuadricula = crear('div', { clase: 'a11y-cuadricula' });
  const mosaicos = new Map();
  const NIVELES = ['contraste', 'espaciado', 'interlineado'];

  for (const opcion of config.opciones) {
    if (opcion === 'texto') continue;
    const boton = crear('button', { type: 'button', clase: 'a11y-mosaico', 'data-opcion': opcion }, icono(opcion));
    boton.append(crear('span', { clase: 'a11y-mosaico__nombre', texto: textos.opciones[opcion] ?? opcion }));
    const nivel = crear('span', { clase: 'a11y-mosaico__estado' });
    boton.append(nivel);
    if (!NIVELES.includes(opcion)) boton.setAttribute('aria-pressed', 'false');
    mosaicos.set(opcion, { boton, nivel });
    cuadricula.append(boton);
  }

  const bRestablecer = crear('button', { type: 'button', clase: 'a11y-restablecer' }, icono('restablecer'));
  bRestablecer.append(crear('span', { texto: textos.restablecer }));

  if (config.opciones.includes('texto')) presentacion.append(tamano);
  presentacion.append(cuadricula, bRestablecer);

  cuerpo.append(reproductor, presentacion, crear('p', { clase: 'a11y-atajo', texto: textos.atajo }), anuncio);
  panel.append(cabecera, cuerpo);
  document.body.append(disparador, panel);

  /* ---------- Pintar el estado en los controles ---------- */

  const textoNivel = (opcion) => {
    if (opcion === 'contraste') return textos.contrastes[estado.contraste];
    return textos.niveles[estado[opcion]];
  };

  function pintar() {
    valorTamano.textContent = `${estado.texto} %`;
    for (const [opcion, { boton, nivel }] of mosaicos) {
      if (NIVELES.includes(opcion)) {
        const actual = opcion === 'contraste' ? estado.contraste : estado[opcion];
        const activo = opcion === 'contraste' ? actual !== 'normal' : actual > 0;
        nivel.textContent = textoNivel(opcion);
        boton.classList.toggle('a11y-mosaico--activo', activo);
      } else {
        boton.setAttribute('aria-pressed', String(Boolean(estado[opcion])));
        nivel.textContent = estado[opcion] ? textos.activado : textos.desactivado;
        boton.classList.toggle('a11y-mosaico--activo', Boolean(estado[opcion]));
      }
    }
    if (interruptorEscuchar) {
      interruptorEscuchar.setAttribute('aria-pressed', String(estado.botonesEscuchar));
      interruptorEscuchar.querySelector('.a11y-interruptor__estado').textContent = estado.botonesEscuchar
        ? textos.activado
        : textos.desactivado;
    }
    bVelocidad.textContent = `${textos.velocidad}: ${textos.velocidades[estado.velocidad]}`;
  }

  const cambiar = (cambios, mensaje) => {
    estado = { ...estado, ...cambios };
    aplicar();
    guardar();
    pintar();
    if (mensaje) anunciar(mensaje);
  };

  for (const [opcion, { boton }] of mosaicos) {
    boton.addEventListener('click', () => {
      const nombre = textos.opciones[opcion];
      if (opcion === 'contraste') {
        const siguiente = contrastes[(contrastes.indexOf(estado.contraste) + 1) % contrastes.length];
        cambiar({ contraste: siguiente }, `${nombre}: ${textos.contrastes[siguiente]}`);
      } else if (NIVELES.includes(opcion)) {
        const siguiente = (estado[opcion] + 1) % 3;
        cambiar({ [opcion]: siguiente }, `${nombre}: ${textos.niveles[siguiente]}`);
      } else {
        const valor = !estado[opcion];
        cambiar({ [opcion]: valor }, `${nombre}: ${valor ? textos.activado : textos.desactivado}`);
      }
    });
  }

  const cambiarTamano = (paso) => {
    const indice = ESCALAS.indexOf(estado.texto) + paso;
    const limite = indice < 0 ? textos.tamanoMinimo : indice >= ESCALAS.length ? textos.tamanoMaximo : '';
    if (limite) {
      if (!conAnuncios) valorTamano.textContent = `${estado.texto} %. ${limite}`;
      return anunciar(`${estado.texto} %. ${limite}`);
    }
    cambiar({ texto: ESCALAS[indice] }, `${textos.tamano}: ${ESCALAS[indice]} %`);
  };
  bReducir.addEventListener('click', () => cambiarTamano(-1));
  bAumentar.addEventListener('click', () => cambiarTamano(1));

  bRestablecer.addEventListener('click', () => {
    detener();
    cambiar({ ...PREDETERMINADO, voz: estado.voz }, textos.restablecido);
  });

  interruptorEscuchar?.addEventListener('click', () => {
    const valor = !estado.botonesEscuchar;
    cambiar({ botonesEscuchar: valor }, `${textos.botonesEscuchar}: ${valor ? textos.activado : textos.desactivado}`);
  });

  bVelocidad.addEventListener('click', () => {
    const siguiente = VELOCIDADES[(VELOCIDADES.indexOf(estado.velocidad) + 1) % VELOCIDADES.length];
    cambiar({ velocidad: siguiente }, `${textos.velocidad}: ${textos.velocidades[siguiente]}`);
    if (leyendo) leerActual();
  });

  listaVoces.addEventListener('change', () => {
    cambiar({ voz: listaVoces.value });
    if (leyendo) leerActual();
  });

  /* ---------- Voces disponibles ---------- */

  function pintarVoces() {
    const voces = vocesDisponibles();
    listaVoces.replaceChildren(
      ...voces.map((voz) => crear('option', { value: voz.voiceURI, texto: `${voz.name} (${voz.lang})` }))
    );
    if (voces.some((voz) => voz.voiceURI === estado.voz)) listaVoces.value = estado.voz;
    const hay = voces.length > 0;
    eleccionVoz.hidden = !hay;
    for (const boton of [bAnterior, bReproducir, bDetener, bSiguiente, bVelocidad]) boton.disabled = !hay;
    if (interruptorEscuchar) interruptorEscuchar.disabled = !hay;
    notaVoz.textContent = !lecturaSoportada() ? textos.sinSoporte : hay ? textos.privacidadVoz : textos.sinVoz;
    if (!leyendo && indice < 0) estadoLectura.textContent = hay ? textos.lecturaListo : '';
  }
  alCambiarVoces(pintarVoces);

  /* ---------- Lectura secuencial ---------- */

  let unidades = [];
  let indice = -1;
  let leyendo = false;
  let detenerVoz = () => {};

  function recoger() {
    const contenedor = config.contenedorLectura?.();
    if (!contenedor) return [];
    const selector = config.bloquesSueltos ? `${unidadesSelector}, div, span, label, strong` : unidadesSelector;
    const candidatos = Array.from(contenedor.querySelectorAll(selector)).filter((nodo) => {
      if (panel.contains(nodo) || nodo.closest('.lectura-voz__boton, [data-a11y-omitir]')) return false;
      if (!visible(nodo)) return false;
      if (nodo.tagName === 'TR' && (nodo.closest('thead') || Array.from(nodo.cells).every((c) => c.tagName === 'TH' && c.scope !== 'row'))) return false;
      if (config.bloquesSueltos && ['DIV', 'SPAN', 'LABEL', 'STRONG'].includes(nodo.tagName)) {
        // Solo cuenta si tiene texto propio: un contenedor de otros bloques no es un bloque.
        return Array.from(nodo.childNodes).some((hijo) => hijo.nodeType === Node.TEXT_NODE && hijo.textContent.trim() !== '');
      }
      return nodo.textContent.trim() !== '';
    });
    // Si un antecesor ya es bloque, este se leería dos veces: se conserva el antecesor.
    const conjunto = new Set(candidatos);
    return candidatos.filter((nodo) => {
      for (let padre = nodo.parentElement; padre; padre = padre.parentElement) {
        if (conjunto.has(padre)) return false;
      }
      return true;
    });
  }

  function puntoDePartida() {
    const activo = document.activeElement;
    if (activo && !panel.contains(activo)) {
      const propio = unidades.findIndex((u) => u.contains(activo));
      if (propio >= 0) return propio;
    }
    const enPantalla = unidades.findIndex((u) => u.getBoundingClientRect().bottom > 72);
    return enPantalla >= 0 ? enPantalla : 0;
  }

  function marcar(unidad) {
    for (const previa of document.querySelectorAll('.a11y-leyendo')) previa.classList.remove('a11y-leyendo');
    if (!unidad) return;
    unidad.classList.add('a11y-leyendo');
    const reducir = estado.animaciones || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    unidad.scrollIntoView?.({ block: 'center', behavior: reducir ? 'auto' : 'smooth' });
  }

  function pintarProgreso() {
    const total = unidades.length;
    const n = indice + 1;
    progreso.firstElementChild.style.width = total ? `${Math.round((n / total) * 100)}%` : '0%';
    estadoLectura.textContent = total && indice >= 0 ? (leyendo ? textos.lecturaLeyendo(n, total) : textos.lecturaPausa(n, total)) : textos.lecturaListo;
    bReproducir.querySelector('.a11y-control__texto').textContent = leyendo ? textos.pausar : indice >= 0 ? textos.reanudar : textos.reproducir;
    bReproducir.querySelector('svg').outerHTML = icono(leyendo ? 'pausar' : 'reproducir');
    bReproducir.setAttribute('aria-pressed', String(leyendo));
  }

  function leerActual() {
    detenerVoz();
    const unidad = unidades[indice];
    if (!unidad || !unidad.isConnected) return terminar();
    marcar(unidad);
    pintarProgreso();
    const partes = fragmentos(frases(unidad));
    if (partes.length === 0) return avanzar(1);
    detenerVoz = hablar(partes, {
      voz: estado.voz,
      velocidad: estado.velocidad,
      alTerminar: () => {
        if (leyendo) avanzar(1);
      }
    });
  }

  function avanzar(paso) {
    const siguiente = indice + paso;
    if (siguiente >= unidades.length) return terminar();
    indice = Math.max(0, siguiente);
    leerActual();
  }

  function reproducir() {
    if (!hayVoz()) return;
    const actual = unidades[indice];
    unidades = recoger();
    if (unidades.length === 0) return;
    const previo = actual ? unidades.indexOf(actual) : -1;
    indice = previo >= 0 ? previo : puntoDePartida();
    leyendo = true;
    leerActual();
  }

  function pausar() {
    leyendo = false;
    detenerVoz();
    pintarProgreso();
    anunciar(textos.lecturaPausa(indice + 1, unidades.length));
  }

  function detener() {
    leyendo = false;
    detenerVoz();
    callar();
    indice = -1;
    marcar(null);
    pintarProgreso();
  }

  function terminar() {
    detener();
    anunciar(textos.lecturaFin);
  }

  bReproducir.addEventListener('click', () => (leyendo ? pausar() : reproducir()));
  bDetener.addEventListener('click', detener);
  bAnterior.addEventListener('click', () => {
    if (indice < 0) return reproducir();
    leyendo = true;
    avanzar(-1);
  });
  bSiguiente.addEventListener('click', () => {
    if (indice < 0) return reproducir();
    leyendo = true;
    avanzar(1);
  });

  // Cambiar de vista o de página detiene lo que se estaba leyendo.
  window.addEventListener('hashchange', detener);
  window.addEventListener('pagehide', detener);

  /* ---------- Abrir y cerrar ---------- */

  const disparadores = [disparador, ...(config.disparadores || [])];
  let origen = disparador;

  function abrir(desde) {
    origen = desde || disparador;
    panel.hidden = false;
    for (const boton of disparadores) boton.setAttribute('aria-expanded', 'true');
    pintarVoces();
    requestAnimationFrame(() => panel.classList.add('a11y-panel--abierto'));
    botonCerrar.focus();
  }

  function cerrar(devolverFoco = true) {
    if (panel.hidden) return;
    panel.classList.remove('a11y-panel--abierto');
    panel.hidden = true;
    for (const boton of disparadores) boton.setAttribute('aria-expanded', 'false');
    if (devolverFoco && origen?.isConnected) origen.focus();
  }

  for (const boton of disparadores) {
    boton.setAttribute('aria-controls', 'a11y-panel');
    boton.setAttribute('aria-expanded', 'false');
    boton.addEventListener('click', () => (panel.hidden ? abrir(boton) : cerrar()));
  }
  botonCerrar.addEventListener('click', () => cerrar());
  panel.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      evento.stopPropagation();
      cerrar();
    }
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.altKey && !evento.ctrlKey && !evento.metaKey && evento.key.toLowerCase() === 'a') {
      evento.preventDefault();
      if (panel.hidden) abrir(document.activeElement instanceof HTMLElement ? document.activeElement : disparador);
      else cerrar();
    }
  });

  aplicar();
  pintar();
  pintarVoces();
  pintarProgreso();

  return {
    abrir,
    cerrar,
    estado: () => ({ ...estado }),
    detenerLectura: detener
  };
}
