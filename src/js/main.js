/* Punto de entrada: lee los datos, arma la interfaz y conecta dictado, accesibilidad y bienvenida.
   Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { $, esc, setStatus, iniciarBitacora } from './bitacora.js';
import { crearBase } from './base-conocimiento.js';
import { iniciarRespuestas, addBot, addUser, answer, reproducirConversacion, saludoDelChat } from './respuestas.js';
import { iniciarAccesibilidad, alAgregarRespuesta, leerRespuestaAutomatica, leerPreferencias, panel } from './accesibilidad.js';
import { abrirDialogoPerfil } from './bienvenida.js';
import { crearReservados } from './reservados.js';
import { iniciarGlosario } from './glosario.js';
import { iniciarTemas } from './temas.js';

const datos = JSON.parse(document.getElementById('datos-kb').textContent);
const KB = datos.kb, FAQ = (datos.faq && datos.faq.items) || [];
const reservados = crearReservados(datos.reservados || []);
const base = crearBase(KB, FAQ, reservados);
iniciarGlosario(base.glosario, base.nombreAnexo);
const { N, acuerdos, scopeIndex, faqIndex } = base;

/* ---------- Entidades ---------- */
const entSel = $('#entidad');
entSel.innerHTML = '<option value="">Todas / aún no sé</option>' + acuerdos.map(d=>`<option value="${esc(d.entity)}">${esc(d.entity)}</option>`).join('');
$('#kbVersion').textContent = KB.version;

const logEl = $('#log');

/* ---------- Dictado ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const mic=$('#micBtn'); let rec=null;
if(!SR){ mic.hidden=true; }
else{
  mic.addEventListener('click',()=>{
    if(rec){ rec.stop(); return; }
    rec=new SR(); rec.lang='es-CO'; rec.interimResults=false; rec.maxAlternatives=1;
    rec.onresult=e=>{ $('#pregunta').value=e.results[0][0].transcript; setStatus('Pregunta dictada. Revísela y oprima Enviar.'); $('#pregunta').focus(); };
    rec.onerror=()=>setStatus('No se pudo usar el micrófono.');
    rec.onend=()=>{ rec=null; mic.setAttribute('aria-pressed','false'); };
    mic.setAttribute('aria-pressed','true'); setStatus('Escuchando… hable ahora.'); rec.start();
  });
}


iniciarRespuestas(base, { entSel, logEl, alAgregarRespuesta, alResponder: leerRespuestaAutomatica, reservados, alElegirEntidad, enviarPregunta });
iniciarBitacora();

/* ---------- Conversación ---------- */
const historial = []; // preguntas hechas y entidad elegida al hacerlas, para conservarlas al cambiar de perfil
const temas = iniciarTemas({ temas: datos.temas || [], faq: FAQ, enviarPregunta });
/* Envía una pregunta (escrita, dictada, de un tema o sugerida): la agrega a la conversación, la responde y pliega los temas. */
function enviar(q, { anuncio, espera = 30 } = {}){
  historial.push({ q, entidad: entSel.value });
  addUser(q); $('#pregunta').value=''; setStatus(anuncio || 'Buscando en los documentos…'); temas.plegar();
  setTimeout(()=>{ try{ answer(q); setStatus('Respuesta lista.'); }catch(err){ console.error(err); setStatus('Ocurrió un error al buscar la respuesta.'); } }, espera);
}
function enviarPregunta(texto){ enviar(texto); $('#pregunta').focus(); }
/* Elegida la entidad en el buscador de una respuesta, se vuelve a enviar la misma pregunta con ella. */
function alElegirEntidad(q, entidad){
  entSel.value = entidad;
  enviar(q, { anuncio: `Entidad elegida: ${entidad}.`, espera: 700 });
  $('#pregunta').focus();
}
$('#form').addEventListener('submit',e=>{
  e.preventDefault(); const q=$('#pregunta').value.trim(); if(!q){ setStatus('Escriba una pregunta.'); $('#pregunta').focus(); return; }
  enviar(q);
});
$('#pregunta').addEventListener('keydown',e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); $('#form').requestSubmit(); } });

/* Saludo del chat (texto aprobado; el número de entidades sale de los datos). */
const saludo = saludoDelChat(N);
addBot(saludo.html, saludo.speech, null);

/* Aviso inicial: una frase completa y, con «Ver más», el texto largo (oculto con `hidden` mientras está plegado). */
const avisoBoton = $('#aviso-alternar'), avisoTexto = $('#aviso-texto');
avisoBoton.addEventListener('click', () => {
  const abrir = avisoTexto.hidden;
  avisoTexto.hidden = !abrir;
  avisoBoton.setAttribute('aria-expanded', String(abrir));
  avisoBoton.textContent = abrir ? 'Ver menos' : 'Ver más';
});

/* Caja de pregunta: fija abajo, salvo con ventanas de menos de 500 px de alto o si ocupa más de un tercio de la ventana
   (por ejemplo, con el texto al 200 %): entonces queda al final de la columna. Publica su alto en --alto-form. */
const formulario = $('#form'), interior = formulario.querySelector('.form-interior');
function ajustarFormulario(){
  const alto = interior.offsetHeight + 1; // el borde superior; igual en los dos modos
  const estatico = window.innerHeight < 500 || alto > window.innerHeight / 3;
  formulario.dataset.modo = estatico ? 'estatico' : 'fijo';
  document.documentElement.style.setProperty('--alto-form', estatico ? '0px' : formulario.offsetHeight + 'px');
}
ajustarFormulario();
window.addEventListener('resize', ajustarFormulario);
window.addEventListener('orientationchange', ajustarFormulario);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(ajustarFormulario).observe(interior);

/* Alt + 1: va a la caja de pregunta. */
document.addEventListener('keydown',e=>{ if(e.altKey && !e.ctrlKey && !e.metaKey && (e.key==='1' || e.code==='Digit1')){ e.preventDefault(); $('#pregunta').focus(); } });

/* Cambio de perfil: guarda el estado, conserva la conversación y recarga (el panel ya iniciado no permite cambiar su estado). */
const CLAVE_SESION='asistente-docentes.sesion';
$('#btn-perfil').addEventListener('click',()=>{
  abrirDialogoPerfil({
    estadoActual: panel ? panel.estado() : null,
    devolverFoco: $('#btn-perfil'),
    alGuardar: (perfil)=>{
      try{ sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ preguntas: historial, perfil: perfil.nombre })); }catch(e){}
      location.reload();
    }
  });
});
function restaurarSesion(){
  let sesion=null;
  try{ const v=sessionStorage.getItem(CLAVE_SESION); if(v){ sesion=JSON.parse(v); sessionStorage.removeItem(CLAVE_SESION); } }catch(e){}
  if(!sesion) return;
  const preguntas=Array.isArray(sesion.preguntas)?sesion.preguntas:[];
  reproducirConversacion(preguntas); historial.push(...preguntas);
  if(preguntas.length) temas.plegar();
  setStatus(`Se aplicó el perfil ${sesion.perfil}.`);
}

/* Primera visita: el diálogo de perfiles va antes de iniciar el panel, que lee lo que este guarde. */
restaurarSesion();
if(!leerPreferencias().bienvenida) abrirDialogoPerfil({ alCerrar: iniciarAccesibilidad });
else iniciarAccesibilidad();
window.__asistente={answer, scopeIndex, faqIndex};
