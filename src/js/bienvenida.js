/* Bienvenida de accesibilidad con perfiles (diseño de Lexible): un solo diálogo modal con cuatro grupos.
   Perfil, lector de pantalla, presentación que activa el perfil y atajos de teclado. */
import { PREDETERMINADO } from '../../vendor/ebar/js/panel-accesibilidad.js';
import { $, esc } from './bitacora.js';
import { leerPreferencias, guardarPreferencias, preferenciasRecordadas } from './accesibilidad.js';

const CLAVE_PANEL = 'accesibilidad.preferencias';

/* Perfiles, con los preajustes del panel (lo que no aparece queda como esté) y la lectura automática sugerida. */
export const PERFILES = [
  { id: 'visual', nombre: 'Visual', descripcion: 'Texto grande, alto contraste, foco visible y áreas de clic amplias.',
    preajuste: { texto: 150, contraste: 'alto', foco: true, objetivos: true }, lectura: true },
  { id: 'auditivo', nombre: 'Auditivo', descripcion: 'La interfaz no depende del sonido: todo aviso es visual.',
    preajuste: {}, lectura: false },
  { id: 'fisico', nombre: 'Físico', descripcion: 'Botones y áreas de clic grandes, cursor grande y foco reforzado.',
    preajuste: { objetivos: true, foco: true, cursor: true }, lectura: false },
  { id: 'intelectual', nombre: 'Intelectual', descripcion: 'Lectura facilitada, tipografía legible y más espacio entre líneas.',
    preajuste: { facilitado: true, tipografia: true, interlineado: 1 }, lectura: false },
  { id: 'psicosocial', nombre: 'Psicosocial', descripcion: 'Sin animaciones, lectura facilitada y más espacio entre líneas.',
    preajuste: { animaciones: true, facilitado: true, interlineado: 1 }, lectura: false },
  { id: 'sordoceguera', nombre: 'Sordoceguera', descripcion: 'Texto muy grande, alto contraste oscuro, foco reforzado y más espacio.',
    preajuste: { texto: 200, contraste: 'alto-oscuro', foco: true, objetivos: true, espaciado: 1 }, lectura: false },
  { id: 'multiple', nombre: 'Múltiple', descripcion: 'Texto grande, alto contraste, sin animaciones y áreas de clic amplias.',
    preajuste: { texto: 150, contraste: 'alto', objetivos: true, animaciones: true, foco: true }, lectura: false },
  { id: 'adulto-mayor', nombre: 'Adulto mayor', descripcion: 'Texto grande, más espacio entre líneas y áreas de clic amplias.',
    preajuste: { texto: 150, interlineado: 1, objetivos: true, foco: true }, lectura: true },
  { id: 'sin-preferencia', nombre: 'Sin preferencia', descripcion: 'Configuración estándar. Puede ajustarla en cualquier momento con Alt + A.',
    preajuste: {}, lectura: false }
];

const NIVELES = ['Normal', 'Amplio', 'Muy amplio'];
const CONTRASTES = { normal: 'Normal', oscuro: 'Tema oscuro', alto: 'Alto contraste', 'alto-oscuro': 'Alto contraste oscuro' };
/* Cómo se dice en texto cada ajuste del preajuste (mismos nombres que usa el panel). */
const ETIQUETAS = {
  texto: (v) => `Tamaño del texto: ${v} %`,
  contraste: (v) => `Contraste: ${CONTRASTES[v] || v}`,
  espaciado: (v) => `Espaciado del texto: ${NIVELES[v]}`,
  interlineado: (v) => `Altura de línea: ${NIVELES[v]}`,
  tipografia: () => 'Tipografía legible',
  facilitado: () => 'Lectura facilitada',
  animaciones: () => 'Detener animaciones',
  cursor: () => 'Cursor grande',
  foco: () => 'Foco reforzado',
  objetivos: () => 'Áreas de clic amplias'
};
export const ajustesDe = (perfil) => Object.entries(perfil.preajuste).map(([clave, valor]) => ETIQUETAS[clave](valor));
export const perfilPorId = (id) => PERFILES.find((p) => p.id === id) || PERFILES[PERFILES.length - 1];

const TEXTO_LECTOR_EXTERNO = 'Como usa un lector de pantalla, el asistente no leerá en voz alta por su cuenta, para que no se superpongan las dos voces.';
const TEXTO_SIN_AJUSTES = 'Este perfil no cambia ningún ajuste: queda la presentación que ya tiene.';

function leerEstadoPanel() {
  try { const v = window.localStorage.getItem(CLAVE_PANEL); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}

/** Escribe en la clave del panel el estado actual combinado con el preajuste del perfil. */
export function escribirEstadoPanel(perfil, estadoActual) {
  const base = estadoActual || leerEstadoPanel() || PREDETERMINADO;
  const nuevo = { ...PREDETERMINADO, ...base, ...perfil.preajuste };
  try { window.localStorage.setItem(CLAVE_PANEL, JSON.stringify(nuevo)); } catch (e) { /* sin almacenamiento disponible */ }
  return nuevo;
}

/**
 * Abre el diálogo. `alGuardar(perfil, preferencias)` se llama al guardar; `alCerrar()` siempre al cerrar,
 * por «Guardar y empezar», «Omitir» o Escape. `estadoActual` es el estado del panel si ya está iniciado.
 */
export function abrirDialogoPerfil({ alGuardar, alCerrar, estadoActual = null, devolverFoco = null }) {
  const dlg = $('#dlg-bienvenida');
  const prefs = leerPreferencias();
  const contenedor = $('#bv-perfiles');
  contenedor.innerHTML = PERFILES.map((p) => `
    <div class="bv-perfil">
      <input type="radio" name="bv-perfil" id="bv-p-${p.id}" value="${p.id}" aria-describedby="bv-d-${p.id}"${prefs.bienvenida && prefs.perfil === p.id ? ' checked' : ''}>
      <label for="bv-p-${p.id}"><span class="bv-nombre">${esc(p.nombre)}</span></label>
      <span class="bv-desc" id="bv-d-${p.id}">${esc(p.descripcion)}</span>
    </div>`).join('');
  const radios = Array.from(contenedor.querySelectorAll('input'));
  const lector = $('#bv-lector');
  const lectura = $('#bv-lectura');
  const aviso = $('#bv-aviso-lector');
  const recordar = $('#bv-recordar');
  lector.checked = Boolean(prefs.lectorExterno);
  lectura.checked = Boolean(prefs.lecturaAutomatica) && !lector.checked;
  recordar.checked = prefs.bienvenida ? preferenciasRecordadas() : true;
  aviso.textContent = TEXTO_LECTOR_EXTERNO;

  const perfilElegido = () => perfilPorId((radios.find((r) => r.checked) || {}).value);
  function pintarLectura() {
    lectura.disabled = lector.checked;
    if (lector.checked) lectura.checked = false;
    aviso.hidden = !lector.checked;
  }
  function pintarAjustes() {
    const ajustes = ajustesDe(perfilElegido());
    $('#bv-ajustes').innerHTML = (ajustes.length ? ajustes : [TEXTO_SIN_AJUSTES]).map((t) => `<li>${esc(t)}</li>`).join('');
  }
  pintarLectura();
  pintarAjustes();

  const alElegir = () => {
    pintarAjustes();
    if (!lector.checked) lectura.checked = perfilElegido().lectura;
  };
  radios.forEach((r) => r.addEventListener('change', alElegir));
  lector.onchange = pintarLectura;

  let cerrado = false;
  function cerrar(guardar) {
    if (cerrado) return;
    cerrado = true;
    const perfil = perfilElegido();
    const preferencias = { perfil: perfil.id, lectorExterno: lector.checked, lecturaAutomatica: lectura.checked && !lector.checked, bienvenida: true };
    $('#bv-guardar').onclick = $('#bv-omitir').onclick = dlg.oncancel = null;
    radios.forEach((r) => r.removeEventListener('change', alElegir));
    dlg.close();
    if (guardar) {
      guardarPreferencias(preferencias, recordar.checked);
      escribirEstadoPanel(perfil, estadoActual);
      alGuardar && alGuardar(perfil, preferencias);
    } else if (!prefs.bienvenida) {
      // Omitir en la primera visita: no vuelve a abrirse, sin cambiar nada más.
      guardarPreferencias({ bienvenida: true }, recordar.checked);
    }
    if (devolverFoco) devolverFoco.focus();
    else $('#pregunta').focus();
    alCerrar && alCerrar(guardar);
  }
  $('#bv-guardar').onclick = () => cerrar(true);
  $('#bv-omitir').onclick = () => cerrar(false);
  dlg.oncancel = (e) => { e.preventDefault(); cerrar(false); };

  dlg.showModal();
  radios[0].focus();
}
