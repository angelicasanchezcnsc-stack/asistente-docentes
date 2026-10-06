/* Buscador de entidad dentro de la respuesta «Depende de su entidad» (patrón combobox de WAI-ARIA 1.2).
   Los anuncios van en #status de la página, no en la respuesta: #log ya es una región viva. */
import { norm } from './motor-busqueda.js';
import { $, esc, setStatus } from './bitacora.js';

/**
 * Entidades cuyo nombre contiene todas las palabras de la consulta (sin tildes ni mayúsculas, en cualquier orden).
 * `claves` asocia cada entidad con su parte territorial normalizada; las que empiezan por la primera palabra van primero.
 */
export function buscarEntidades(consulta, entidades, claves, max = 8) {
  const palabras = norm(consulta).split(' ').filter((p) => p.length >= 2);
  if (palabras.length === 0) return { lista: [], total: 0, hayMas: false };
  const coinciden = entidades.filter((e) => { const n = norm(e); return palabras.every((p) => n.includes(p)); });
  const empieza = (e) => ((claves.get(e) || '').startsWith(palabras[0]) ? 0 : 1);
  coinciden.sort((a, b) => empieza(a) - empieza(b) || a.localeCompare(b, 'es'));
  return { lista: coinciden.slice(0, max), total: coinciden.length, hayMas: coinciden.length > max };
}

export const mensajeResultados = (total, hayMas) => {
  if (total === 0) return 'Sin resultados. Revise la ortografía o escriba otra parte del nombre.';
  const base = total === 1 ? 'Una entidad encontrada.' : `${total} entidades encontradas.`;
  return hayMas ? `${base} Hay más entidades: siga escribiendo para acotar.` : base;
};

export function crearBuscadorEntidad({ id, entidades, claves, alElegir }) {
  const sitio = document.createElement('div');
  sitio.className = 'buscador-entidad';
  sitio.setAttribute('data-a11y-omitir', '');
  sitio.innerHTML =
    `<label for="${id}-entrada">Nombre de su entidad</label>` +
    `<input type="text" id="${id}-entrada" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-lista" autocomplete="off" spellcheck="false">` +
    `<ul id="${id}-lista" role="listbox" aria-label="Entidades encontradas" hidden></ul>` +
    `<p class="hint" id="${id}-estado"></p>`;
  const entrada = sitio.querySelector('input');
  const lista = sitio.querySelector('ul');
  const estado = sitio.querySelector('p');
  let opciones = [];
  let activa = -1;

  function marcar(i) {
    activa = i;
    opciones.forEach((li, n) => li.setAttribute('aria-selected', String(n === i)));
    if (i >= 0) { entrada.setAttribute('aria-activedescendant', opciones[i].id); opciones[i].scrollIntoView({ block: 'nearest' }); }
    else entrada.removeAttribute('aria-activedescendant');
  }
  function cerrar() {
    lista.hidden = true;
    entrada.setAttribute('aria-expanded', 'false');
    marcar(-1);
  }
  function elegir(entidad) {
    sitio.replaceWith(Object.assign(document.createElement('p'), { className: 'plain', textContent: `Entidad elegida: ${entidad}.` }));
    alElegir(entidad);
  }
  function actualizar() {
    const r = buscarEntidades(entrada.value, entidades, claves);
    if (norm(entrada.value).replace(/ /g, '').length < 2) { cerrar(); lista.innerHTML = ''; opciones = []; estado.textContent = ''; return; }
    lista.innerHTML = r.lista.map((e, n) => `<li role="option" id="${id}-op${n}" aria-selected="false">${esc(e)}</li>`).join('');
    opciones = Array.from(lista.children);
    activa = -1;
    entrada.removeAttribute('aria-activedescendant');
    lista.hidden = opciones.length === 0;
    entrada.setAttribute('aria-expanded', String(opciones.length > 0));
    const mensaje = mensajeResultados(r.total, r.hayMas);
    estado.textContent = mensaje;
    setStatus(mensaje);
  }

  entrada.addEventListener('input', actualizar);
  entrada.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (opciones.length === 0) return;
      e.preventDefault();
      if (lista.hidden) { lista.hidden = false; entrada.setAttribute('aria-expanded', 'true'); }
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      marcar(activa === -1 ? (paso === 1 ? 0 : opciones.length - 1) : (activa + paso + opciones.length) % opciones.length);
    } else if (e.key === 'Enter') {
      if (lista.hidden || opciones.length === 0) return;
      const i = activa >= 0 ? activa : opciones.length === 1 ? 0 : -1;
      if (i >= 0) { e.preventDefault(); elegir(opciones[i].textContent); }
    } else if (e.key === 'Escape' && !lista.hidden) {
      e.preventDefault(); e.stopPropagation(); cerrar();
    } else if (e.key === 'Tab') cerrar();
  });
  // El clic en una opción no debe quitarle el foco al campo antes de elegirla.
  lista.addEventListener('pointerdown', (e) => e.preventDefault());
  lista.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) elegir(li.textContent); });
  entrada.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== entrada) cerrar(); }, 120));
  return sitio;
}
