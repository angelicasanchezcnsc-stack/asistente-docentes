/* Utilidades de almacenamiento y presentación, y bitácora de preguntas.
   Movido sin cambios de lógica desde plantilla.html (v0.1). */
export const $ = s => document.querySelector(s);
export const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
export function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function setStatus(t){ $('#status').textContent=t; }

let silencio=false;
/* Al volver a responder una conversación (cambio de perfil) la bitácora no se duplica. */
export function silenciarBitacora(valor){ silencio=valor; }
export function logGap(q, motivo, cand){
  if(silencio) return;
  const arr=store.get('bitacora',[]);
  arr.push({fecha:new Date().toISOString().slice(0,16).replace('T',' '), pregunta:q.replace(/\d{6,}/g,'[número]'), entidad:$('#entidad').value||'Todas', motivo, candidata:cand||''});
  store.set('bitacora',arr);
}
function renderLog(){
  const arr=store.get('bitacora',[]);
  $('#dlgBody').innerHTML = arr.length ? '<table class="data"><caption class="sr-only">Preguntas registradas</caption><thead><tr><th scope="col">Fecha</th><th scope="col">Pregunta</th><th scope="col">Entidad</th><th scope="col">Motivo</th><th scope="col">Fuente más cercana</th></tr></thead><tbody>'+arr.slice().reverse().map(r=>`<tr><td class="mono">${esc(r.fecha)}</td><td>${esc(r.pregunta)}</td><td>${esc(r.entidad)}</td><td>${esc(r.motivo)}</td><td>${esc(r.candidata)}</td></tr>`).join('')+'</tbody></table>' : '<p>No hay preguntas registradas.</p>';
}
export function iniciarBitacora(){
  $('#logBtn').onclick=()=>{ renderLog(); $('#dlg').showModal(); };
  $('#dlgClose').onclick=()=>$('#dlg').close();
  $('#dlgClear').onclick=()=>{ store.set('bitacora',[]); renderLog(); setStatus('Bitácora vaciada.'); };
  $('#dlgCsv').onclick=()=>{
    const arr=store.get('bitacora',[]); const cols=['fecha','pregunta','entidad','motivo','candidata'];
    const csv='﻿'+cols.join(';')+'\n'+arr.map(r=>cols.map(c=>'"'+String(r[c]).replace(/"/g,'""')+'"').join(';')).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); a.download='bitacora_asistente_docentes.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  };
}
