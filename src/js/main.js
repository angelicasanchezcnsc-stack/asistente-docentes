/* Punto de entrada: lee los datos, arma la interfaz y conecta dictado, accesibilidad y bienvenida.
   Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { $, esc, setStatus, iniciarBitacora } from './bitacora.js';
import { crearBase } from './base-conocimiento.js';
import { iniciarRespuestas, addBot, addUser, answer, reproducirConversacion } from './respuestas.js';
import { iniciarAccesibilidad, alAgregarRespuesta, leerRespuestaAutomatica, leerPreferencias, panel } from './accesibilidad.js';
import { abrirDialogoPerfil } from './bienvenida.js';

const datos = JSON.parse(document.getElementById('datos-kb').textContent);
const KB = datos.kb, FAQ = (datos.faq && datos.faq.items) || [];
const base = crearBase(KB, FAQ);
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


iniciarRespuestas(base, { entSel, logEl, alAgregarRespuesta, alResponder: leerRespuestaAutomatica });
iniciarBitacora();

/* ---------- Conversación ---------- */
const historial = []; // preguntas hechas y entidad elegida al hacerlas, para conservarlas al cambiar de perfil
$('#form').addEventListener('submit',e=>{
  e.preventDefault(); const q=$('#pregunta').value.trim(); if(!q){ setStatus('Escriba una pregunta.'); $('#pregunta').focus(); return; }
  historial.push({ q, entidad: entSel.value });
  addUser(q); $('#pregunta').value=''; setStatus('Buscando en los documentos…');
  setTimeout(()=>{ try{ answer(q); setStatus('Respuesta lista.'); }catch(err){ console.error(err); setStatus('Ocurrió un error al buscar la respuesta.'); } },30);
});
$('#pregunta').addEventListener('keydown',e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); $('#form').requestSubmit(); } });

/* Preguntas sugeridas */
$('#sugeridas').innerHTML=FAQ.slice(0,7).map((f,i)=>`<div role="listitem"><button type="button" class="chip" data-i="${i}">${esc(f.pregunta)}</button></div>`).join('');
$('#sugeridas').addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b) return; $('#pregunta').value=FAQ[+b.dataset.i].pregunta; $('#form').requestSubmit(); });

/* Bienvenida */
addBot(`<p class="plain">Hola. Respondo preguntas sobre el proceso de selección de Docentes y Directivos Docentes con base en los proyectos de acuerdo de las ${N} entidades y en el proyecto de anexo técnico. En cada respuesta le muestro el texto oficial y su fuente.</p><p>Si su pregunta depende de su entidad, por ejemplo vacantes o financiación, elíjala en el panel «Antes de preguntar».</p>`,
 `Hola. Respondo preguntas sobre el proceso de selección de Docentes y Directivos Docentes con base en los proyectos de acuerdo y en el proyecto de anexo técnico. En cada respuesta le muestro el texto oficial y su fuente.`, null);

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
  setStatus(`Se aplicó el perfil ${sesion.perfil}.`);
}

/* Primera visita: el diálogo de perfiles va antes de iniciar el panel, que lee lo que este guarde. */
restaurarSesion();
if(!leerPreferencias().bienvenida) abrirDialogoPerfil({ alCerrar: iniciarAccesibilidad });
else iniciarAccesibilidad();
window.__asistente={answer, scopeIndex, faqIndex};
