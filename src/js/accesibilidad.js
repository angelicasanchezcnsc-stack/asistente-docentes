/* Panel de accesibilidad del Instrumento EBAR (el mismo de IncluIA) y lectura en voz alta con voces locales.
   El modelo de integración es components/AccessibilityWidget.tsx de IncluIA. */
import { iniciarPanelAccesibilidad } from '../../vendor/ebar/js/panel-accesibilidad.js';
import { hablar, callar, frasesDe, fragmentos, hayVoz, alCambiarVoces } from '../../vendor/ebar/js/voz-motor.js';
import { store } from './bitacora.js';

export let panel = null;
let estadoPanel = null; // última presentación publicada por el panel

/* Preferencias del asistente que no son del panel (perfil, lector externo, lectura automática). */
const CLAVE_PREFERENCIAS = 'asistente-docentes.preferencias';
const PREFERENCIAS_BASE = { perfil: '', lectorExterno: false, lecturaAutomatica: false };
export const leerPreferencias = () => ({ ...PREFERENCIAS_BASE, ...store.get(CLAVE_PREFERENCIAS, {}) });
export const guardarPreferencias = (p) => store.set(CLAVE_PREFERENCIAS, { ...leerPreferencias(), ...p });

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
