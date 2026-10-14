/* Temas: llegar a las preguntas frecuentes sin escribir (herramientas/temas.json). Desde la fase 11 se muestran como burbujas. */
import { $, esc } from './bitacora.js';
import { icono } from './iconos.js';

export function iniciarTemas({ temas, faq, enviarPregunta }) {
  const porId = new Map(faq.map((f) => [f.id, f]));
  const cuerpo = $('#temas-cuerpo');
  const alternar = $('#temas-alternar');
  const lista = $('#temas-lista');
  const panelPreguntas = $('#temas-preguntas');
  const subtitulo = $('#temas-subtitulo');
  const listaPreguntas = $('#temas-lista-preguntas');
  let abierta = null; // tarjeta del tema que se está viendo

  // Fase 11: burbujas de una línea con su icono, sin el número de preguntas.
  lista.innerHTML = temas.map((t) =>
    `<li><button type="button" class="tema-tarjeta" data-tema="${esc(t.id)}">${icono(t.icono)}<span class="tema-texto"><span class="tema-titulo">${esc(t.titulo)}</span></span></button></li>`
  ).join('');

  function verTarjetas(devolverFoco) {
    panelPreguntas.hidden = true;
    lista.hidden = false;
    if (devolverFoco && abierta) abierta.focus();
    abierta = null;
  }
  function verPreguntas(tarjeta) {
    const tema = temas.find((t) => t.id === tarjeta.dataset.tema);
    abierta = tarjeta;
    subtitulo.textContent = tema.titulo;
    listaPreguntas.innerHTML = tema.faq.map((id) =>
      `<li><button type="button" class="btn tema-pregunta">${esc(porId.get(id).pregunta)}</button></li>`
    ).join('');
    lista.hidden = true;
    panelPreguntas.hidden = false;
    subtitulo.focus();
  }

  lista.addEventListener('click', (e) => {
    const tarjeta = e.target.closest('.tema-tarjeta');
    if (tarjeta) verPreguntas(tarjeta);
  });
  listaPreguntas.addEventListener('click', (e) => {
    const boton = e.target.closest('.tema-pregunta');
    if (boton) enviarPregunta(boton.textContent);
  });
  $('#temas-volver').addEventListener('click', () => verTarjetas(true));
  panelPreguntas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); verTarjetas(true); }
  });

  function fijar(desplegada) {
    cuerpo.hidden = !desplegada;
    alternar.setAttribute('aria-expanded', String(desplegada));
    alternar.textContent = desplegada ? 'Ocultar los temas' : 'Ver los temas';
  }
  alternar.addEventListener('click', () => fijar(cuerpo.hidden));

  return {
    /** Se llama al enviar cualquier pregunta: vuelve a las tarjetas y deja la sección plegada. */
    plegar() { verTarjetas(false); fijar(false); },
    desplegar() { fijar(true); }
  };
}
