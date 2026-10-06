/* Punto de entrada: lee los datos, arma la interfaz y conecta dictado, accesibilidad y bienvenida.
   Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { $, esc, setStatus, iniciarBitacora } from './bitacora.js';
import { crearBase } from './base-conocimiento.js';
import { iniciarRespuestas, addBot, addUser, answer } from './respuestas.js';
import { iniciarAccesibilidad, alAgregarRespuesta } from './accesibilidad.js';

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


iniciarAccesibilidad();
iniciarRespuestas(base, { entSel, logEl, alAgregarRespuesta });
iniciarBitacora();

/* ---------- Conversación ---------- */
$('#form').addEventListener('submit',e=>{
  e.preventDefault(); const q=$('#pregunta').value.trim(); if(!q){ setStatus('Escriba una pregunta.'); $('#pregunta').focus(); return; }
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
window.__asistente={answer, scopeIndex, faqIndex};
