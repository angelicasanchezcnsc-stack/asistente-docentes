/* Glosario literal: la primera aparición de cada término en una respuesta se vuelve un botón que abre su definición,
   tomada tal cual del anexo (kb.glosario). No se enlazan términos en encabezados de tabla ni dentro del propio diálogo. */
import { $, esc } from './bitacora.js';

let terminos = [];
let nombreAnexo = '';
let origen = null;

const escaparRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function iniciarGlosario(lista, anexo) {
  nombreAnexo = anexo;
  terminos = (lista || []).map((g) => ({
    ...g,
    // Palabra o frase completa, sin distinguir mayúsculas.
    regex: new RegExp('(?<![\\p{L}\\p{N}])(?:' + g.variantes.map(escaparRegex).join('|') + ')(?![\\p{L}\\p{N}])', 'iu')
  }));
  const dlg = $('#dlg-glosario');
  $('#gl-cerrar').addEventListener('click', () => dlg.close());
  // Al cerrar (botón, Escape), el foco vuelve al término.
  dlg.addEventListener('close', () => { if (origen && origen.isConnected) origen.focus(); origen = null; });
}

function abrir(g, boton) {
  origen = boton;
  $('#gl-titulo').textContent = g.termino;
  $('#gl-definicion').innerHTML = g.definicion.split('\n').map((p) => `<p>${esc(p)}</p>`).join('');
  $('#gl-fuente').innerHTML = `<span class="badge warn">Borrador</span> <span><strong>Fuente:</strong> ${esc(nombreAnexo)}, ${esc(g.fuente.rotulo)}</span>`;
  $('#dlg-glosario').showModal();
}

/** Texto de un bloque con la posición de cada nodo de texto (también a través de <mark> u otros elementos en línea). */
function nodosDeTexto(bloque) {
  const mapa = [];
  let texto = '';
  const recorrido = document.createTreeWalker(bloque, NodeFilter.SHOW_TEXT);
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
    if (nodo.parentElement.closest('button, a, th, summary')) continue;
    mapa.push({ nodo, inicio: texto.length });
    texto += nodo.textContent;
  }
  return { mapa, texto };
}

function posicion(mapa, indice, esFin) {
  for (let i = mapa.length - 1; i >= 0; i--) {
    const { nodo, inicio } = mapa[i];
    if (indice > inicio || (indice === inicio && !esFin)) return { nodo, desplazamiento: indice - inicio };
  }
  return null;
}

/** Enlaza, en la respuesta, la primera aparición de cada término del glosario. */
export function enlazarGlosario(articulo) {
  const bloques = Array.from(articulo.querySelectorAll('.plain, .official p, .official td, .official caption'));
  for (const g of terminos) {
    for (const bloque of bloques) {
      const { mapa, texto } = nodosDeTexto(bloque);
      const m = g.regex.exec(texto);
      if (!m) continue;
      const inicio = posicion(mapa, m.index, false);
      const fin = posicion(mapa, m.index + m[0].length, true);
      if (!inicio || !fin) continue;
      const rango = document.createRange();
      rango.setStart(inicio.nodo, inicio.desplazamiento);
      rango.setEnd(fin.nodo, fin.desplazamiento);
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'glosario-termino';
      boton.setAttribute('aria-haspopup', 'dialog');
      boton.append(rango.extractContents());
      rango.insertNode(boton);
      boton.addEventListener('click', () => abrir(g, boton));
      break; // solo la primera aparición
    }
  }
}
