/* Panel de accesibilidad del Instrumento EBAR (el mismo de IncluIA) y lectura en voz alta con voces locales.
   El modelo de integración es components/AccessibilityWidget.tsx de IncluIA. */
import { iniciarPanelAccesibilidad } from '../../vendor/ebar/js/panel-accesibilidad.js';
// Símbolo de accesibilidad de la ONU: el mismo botón flotante de IncluIA (copia de inclu-ia/public/logo-onu-accesibilidad.jpg).
import logoOnu from '../img/logo-onu-accesibilidad.jpg';
import { hablar, callar, frasesDe, fragmentos, hayVoz, alCambiarVoces } from '../../vendor/ebar/js/voz-motor.js';

export let panel = null;
let estadoPanel = null; // última presentación publicada por el panel

/* Preferencias del asistente que no son del panel (perfil, lector externo, lectura automática, si ya vio la
   bienvenida). Se guardan en localStorage o, si la persona no quiere que se recuerden, en sessionStorage. */
const CLAVE_PREFERENCIAS = 'asistente-docentes.preferencias';
const PREFERENCIAS_BASE = { perfil: '', lectorExterno: false, lecturaAutomatica: false, bienvenida: false };
function leerDe(almacen) {
  try { const v = almacen.getItem(CLAVE_PREFERENCIAS); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
export function leerPreferencias() {
  return { ...PREFERENCIAS_BASE, ...(leerDe(window.sessionStorage) || leerDe(window.localStorage) || {}) };
}
/** Verdadero si las preferencias están en este equipo (localStorage) y no solo en la sesión. */
export const preferenciasRecordadas = () => leerDe(window.sessionStorage) === null;
export function guardarPreferencias(cambios, recordar = true) {
  const valor = JSON.stringify({ ...leerPreferencias(), ...cambios });
  const [destino, otro] = recordar ? ['localStorage', 'sessionStorage'] : ['sessionStorage', 'localStorage'];
  try { window[destino].setItem(CLAVE_PREFERENCIAS, valor); } catch (e) { /* sin almacenamiento disponible */ }
  try { window[otro].removeItem(CLAVE_PREFERENCIAS); } catch (e) { /* ídem */ }
}

/* Cada respuesta tiene su botón «Escuchar»: se muestra solo con la opción activa del panel y,
   si el equipo no tiene voz local en español, queda deshabilitado con su aviso. */
function ajustarEscuchar(articulo) {
  const boton = articulo.querySelector('[data-speak]');
  if (!boton) return;
  const visible = Boolean(estadoPanel && estadoPanel.botonesEscuchar);
  const sinVoz = !hayVoz();
  boton.hidden = !visible;
  boton.disabled = sinVoz;
  articulo.querySelector('.sin-voz').hidden = !(visible && sinVoz);
}
const ajustarTodos = () => document.querySelectorAll('#log article.bot').forEach(ajustarEscuchar);

let activo = null;
function terminarLectura(boton) {
  boton.setAttribute('aria-pressed', 'false');
  if (activo === boton) activo = null;
}
function escuchar(articulo, boton) {
  if (activo === boton) { callar(); terminarLectura(boton); return; }
  if (activo) terminarLectura(activo);
  panel.detenerLectura();
  activo = boton;
  boton.setAttribute('aria-pressed', 'true');
  const estado = panel.estado();
  // `voz` es el identificador de la voz elegida en el panel: hablar() lo resuelve a la voz local.
  hablar(fragmentos(frasesDe(articulo)), { voz: estado.voz, velocidad: estado.velocidad, alTerminar: () => terminarLectura(boton) });
}

/* Lo llama respuestas.js cada vez que dibuja una respuesta. */
export function alAgregarRespuesta(articulo) {
  const boton = articulo.querySelector('[data-speak]');
  if (boton) boton.onclick = () => escuchar(articulo, boton);
  ajustarEscuchar(articulo);
}

/* Lectura automática: al aparecer una respuesta nueva se lee el bloque «En pocas palabras» o «Lo más
   relevante» y la línea de la fuente, con el motor del EBAR. Nunca con lector de pantalla externo. */
export function leerRespuestaAutomatica(articulo) {
  const p = leerPreferencias();
  if (!p.lecturaAutomatica || p.lectorExterno || !panel || !hayVoz()) return;
  const titulo = Array.from(articulo.querySelectorAll('h3')).find((h) => /^(En pocas palabras|Lo más relevante)/.test(h.textContent.trim()));
  let principal = titulo ? titulo.nextElementSibling : articulo.querySelector('.plain');
  if (principal && principal.tagName === 'H3') principal = null;
  const frases = [principal, articulo.querySelector('.src')].filter(Boolean).flatMap((nodo) => frasesDe(nodo));
  if (frases.length === 0) return;
  panel.detenerLectura();
  const estado = panel.estado();
  hablar(fragmentos(frases), { voz: estado.voz, velocidad: estado.velocidad });
}

/* Traduce el estado del panel a la presentación del asistente. El contraste lo leen las hojas
   de estilo desde data-a11y-contraste, que el panel publica en <html>. */
function aplicar(estado) {
  estadoPanel = estado;
  const raiz = document.documentElement;
  raiz.style.fontSize = estado.texto + '%';
  raiz.classList.toggle('tipografia-legible', estado.tipografia);
  ajustarTodos();
  // Lectura facilitada: «Otras fuentes relacionadas» queda cerrado.
  if (estado.facilitado) document.querySelectorAll('details.relacionadas[open]').forEach((d) => d.removeAttribute('open'));
}

export function iniciarAccesibilidad() {
  panel = iniciarPanelAccesibilidad({
    clave: 'accesibilidad.preferencias', // misma clave que EBAR e IncluIA
    logo: logoOnu,
    aplicar,
    contenedorLectura: () => document.getElementById('log'),
    bloquesSueltos: true,
    conBotonesEscuchar: true,
    disparadores: [document.getElementById('btn-accesibilidad')],
    opciones: ['texto', 'contraste', 'espaciado', 'interlineado', 'tipografia', 'dislexia',
               'facilitado', 'enlaces', 'animaciones', 'cursor', 'guia', 'foco', 'objetivos'],
    textos: { botonesEscuchar: 'Botón «Escuchar» en cada respuesta' }
  });
  alCambiarVoces(ajustarTodos);
  return panel;
}
