/* Dibujo de respuestas y decisión de qué responder (answer). Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { norm, stem, toks } from './motor-busqueda.js';
import { $, esc, setStatus, logGap } from './bitacora.js';

let N, entSel, logEl, entKeys, detectEntity, scopeIndex, specIndex, faqIndex, findPassage, firstLine, speak;

export function iniciarRespuestas(base, ctx){
  ({ N, entKeys, detectEntity, scopeIndex, specIndex, faqIndex, findPassage, firstLine } = base);
  ({ entSel, logEl, speak } = ctx);
}

function sourceLabel(p){
  const v = '<span class="badge warn">Borrador</span>';
  if(p.kind==='anexo') return `${v} <span><strong>Fuente:</strong> ${esc(p.doc)}, ${esc(p.label)}</span>`;
  if(p.entity && p.entity!=='*') return `${v} <span><strong>Fuente:</strong> Proyecto de Acuerdo de ${esc(p.entity)}, ${esc(p.label)}</span>`;
  const n = p.n||N;
  return `${v} <span><strong>Fuente:</strong> Proyectos de Acuerdo de convocatoria, ${esc(p.label)} <span class="badge info">texto común a ${n} de ${N} acuerdos</span></span>`;
}
function sourceSpeech(p){
  if(p.kind==='anexo') return `Fuente: ${p.doc}, ${p.label}.`;
  if(p.entity && p.entity!=='*') return `Fuente: Proyecto de Acuerdo de ${p.entity}, ${p.label}.`;
  return `Fuente: Proyectos de Acuerdo de convocatoria, ${p.label}.`;
}
function highlight(html, qt){
  if(!qt.length) return html;
  return html.replace(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]{3,})/g, w=>{ const s=stem(norm(w)); return qt.includes(s) ? `<mark>${w}</mark>` : w; });
}
function renderOfficial(text, qt){
  const lines=text.split('\n'); let html=''; let i=0;
  while(i<lines.length){
    if(lines[i].includes(' | ')){
      const rows=[]; while(i<lines.length && lines[i].includes(' | ')){ rows.push(lines[i].split(' | ')); i++; }
      const [h,...b]=rows;
      html+='<table><thead><tr>'+h.map(c=>`<th scope="col">${esc(c)}</th>`).join('')+'</tr></thead><tbody>'+b.map(r=>'<tr>'+r.map(c=>`<td>${highlight(esc(c),qt)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';
    } else { html+=`<p>${highlight(esc(lines[i]),qt)}</p>`; i++; }
  }
  return html;
}
function keySentences(text, qt, max){
  const flat=text.replace(/\n/g,' ').replace(/\b(No|Nos|Art|art|num|Núm|D\.C|Inc|lit)\.\s/g,'$1.\u2060 ');
  const sents=flat.split(/(?<=[.;:])\s+(?=[A-ZÁÉÍÓÚÑ0-9(])/).filter(s=>s.length>25 && !s.includes(' | '));
  const sc=sents.map((s,i)=>{ const st=new Set(toks(s)); let h=0; for(const t of qt) if(st.has(t)) h++; return {s,i,h}; }).filter(x=>x.h>0);
  sc.sort((a,b)=>b.h-a.h||a.i-b.i);
  return sc.slice(0,max||2).sort((a,b)=>a.i-b.i).map(x=>x.s.length>420? x.s.slice(0,417)+'…' : x.s);
}

function addUser(q){ const d=document.createElement('div'); d.className='msg user'; d.innerHTML='<span class="sr-only">Usted preguntó: </span>'+esc(q); logEl.appendChild(d); }
let msgId=0;
function addBot(html, speech, q, topSrc, meta){
  const id='m'+(++msgId); const d=document.createElement('article'); d.className='msg bot'; d.setAttribute('aria-labelledby',id+'h');
  if(meta){ d.dataset.tipo=meta.tipo; d.dataset.fuentes=(meta.fuentes||[]).join(' | '); d.dataset.entidad=meta.entidad||''; d.dataset.fuentePrincipal=meta.principal||''; }
  d.innerHTML=`<h3 id="${id}h" class="sr-only">Respuesta del asistente</h3>`+html+
   `<div class="actions"><button class="btn" type="button" data-speak aria-pressed="false">Escuchar</button><button class="btn" type="button" data-copy>Copiar</button>`+
   (q?`<button class="btn ghost" type="button" data-ok>Me sirvió</button><button class="btn ghost" type="button" data-no>No me sirvió</button>`:'')+`</div>`;
  logEl.appendChild(d);
  d.querySelector('[data-speak]').onclick=e=>speak(speech,e.currentTarget);
  d.querySelector('[data-copy]').onclick=()=>{ const txt=d.innerText.replace(/\n(Escuchar|Copiar|Me sirvió|No me sirvió)/g,''); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>setStatus('Respuesta copiada.'),()=>setStatus('No se pudo copiar.')); };
  if(q){
    d.querySelector('[data-ok]').onclick=e=>{ setStatus('Gracias por su opinión.'); e.currentTarget.parentNode.querySelectorAll('[data-ok],[data-no]').forEach(b=>b.disabled=true); };
    d.querySelector('[data-no]').onclick=e=>{ logGap(q,'No le sirvió la respuesta',topSrc); setStatus('Gracias. La pregunta quedó en la bitácora para mejorar la base.'); e.currentTarget.parentNode.querySelectorAll('[data-ok],[data-no]').forEach(b=>b.disabled=true); };
  }
  d.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block:'start'});
  if($('#autoBtn').getAttribute('aria-pressed')==='true') speak(speech);
}
function passageBlock(p, qt, open){
  const long=p.text.length>900;
  const body=renderOfficial(p.text, qt);
  return `<div class="src">${sourceLabel(p)}</div>`+(long?`<details class="more"${open?' open':''}><summary>Ver texto oficial completo (${esc(p.label)})</summary><div class="official">${body}</div></details>`:`<div class="official">${body}</div>`);
}
function entityTokens(e){ if(!e) return null; const k=entKeys.find(x=>x.e===e); return new Set(toks((k?k.k:'')+' '+e)); }
function answer(q){
  let entity=entSel.value, note='';
  { const det=detectEntity(q); if(det && det!==entity){ entity=det; entSel.value=det; note=`<p class="hint">Usé el acuerdo de <strong>${esc(det)}</strong> porque la mencionó en su pregunta. Puede cambiarla en «Entidad territorial certificada».</p>`; } }
  const drop=entityTokens(entity) || new Set();
  for(const x of ['secret','educac','departamental','municipal','distrital','entida']) drop.add(stem(x));
  const ix=scopeIndex(entity);
  const r=ix.search(q,5,drop); const qt=r.qt;
  const f=faqIndex.search(q,1,drop).res[0];
  const best=r.res[0];
  const faqOk = !!(f && f.cov>=.66 && f.wcov>=.6);
  const passOk = !!(best && best.wcov>=.6 && best.s>=1);
  if(!faqOk && !entity){
    const sp=specIndex.search(q,1,drop).res[0];
    if(sp && sp.wcov>=.8 && (!best || best.wcov<.6)){
      const html=`<h3>Depende de su entidad</h3><p class="plain">Esta información cambia según la entidad territorial certificada (${esc(sp.item.label)} de cada acuerdo). Elija su entidad en el panel «Antes de preguntar» y vuelva a preguntar para ver el texto exacto de su acuerdo.</p>`;
      addBot(html, `Esta información cambia según la entidad territorial certificada. Elija su entidad y vuelva a preguntar.`, null, null, {tipo:'depende-entidad', fuentes:[], entidad:entity});
      return;
    }
  }
  if(!faqOk && !passOk){
    logGap(q,'Sin respuesta en las fuentes', best?`${best.item.label} (${best.item.kind})`:'');
    const html=`<h3>No encontrado</h3><p class="plain">No encontré esta respuesta en los documentos del proceso que tengo disponibles. No voy a responder sin una fuente.</p><p>Su pregunta quedó registrada para que el equipo temático la revise y amplíe la base. Mientras tanto, puede intentar con otras palabras o consultar los canales de atención de la CNSC.</p>`+(best&&best.wcov>=.3?`<details class="more"><summary>Texto más cercano que encontré (puede no responder su pregunta)</summary>${passageBlock(best.item,qt,true)}</details>`:'');
    addBot(note+html, 'No encontré esta respuesta en los documentos del proceso. Su pregunta quedó registrada para que el equipo temático la revise.', null, null, {tipo:'no-encontrado', fuentes:[], entidad:entity});
    return;
  }
  let html=note, speech='', srcs=[];
  const used=new Set();
  if(faqOk && f.item.f.requiereEntidad && !entity){
    const it=f.item.f;
    addBot(`<h3>Depende de su entidad</h3><p class="plain">${esc(it.sinEntidad||'Esta información cambia según la entidad territorial certificada.')}</p><p>Elija su entidad en el panel «Antes de preguntar» y vuelva a preguntar.</p>`, (it.sinEntidad||'Esta información cambia según la entidad.')+' Elija su entidad y vuelva a preguntar.', null, null, {tipo:'depende-entidad', fuentes:[], entidad:entity});
    setTimeout(()=>entSel.focus(),50);
    return;
  }
  if(faqOk){
    const it=f.item.f;
    srcs=it.fuentes.map(ref=>findPassage(entity,ref)).filter(Boolean);
    const resp=it.respuesta.replace('{entidad}', entity||'');
    html+=`<h3>En pocas palabras</h3><p class="plain">${esc(resp)}</p><p class="hint"><span class="badge warn">${esc(it.estado)}</span> Respuesta frecuente redactada a partir del texto oficial que aparece abajo.</p><h3>Texto oficial</h3>`+srcs.map(p=>{ used.add(p.label+'|'+p.kind); return passageBlock(p,qt,!!it.requiereEntidad); }).join('');
    speech=resp+' '+srcs.map(sourceSpeech).join(' ');
  } else {
    const p=best.item; const ks=keySentences(p.text,qt,2);
    html+=`<h3>Lo más relevante del texto oficial</h3>`+(ks.length?`<div class="official">`+ks.map(s=>`<p>${highlight(esc(s),qt)}</p>`).join('')+`</div>`:'')+`<h3>Texto oficial</h3>`+passageBlock(p,qt,!ks.length);
    used.add(p.label+'|'+p.kind);
    speech=(ks.length?ks.join(' '):firstLine(p.text))+' '+sourceSpeech(p);
  }
  const rel=r.res.filter(x=>x.wcov>=.5 && !used.has(x.item.label+'|'+x.item.kind)).slice(0,2);
  if(rel.length) html+=`<details class="more"><summary>Otras fuentes relacionadas (${rel.length})</summary>`+rel.map(x=>passageBlock(x.item,qt,true)).join('<hr style="border:0;border-top:1px solid var(--light)">')+`</details>`;
  const rotulos=(faqOk? srcs : [best.item]).concat(rel.map(x=>x.item)).map(p=>p.label);
  addBot(html, speech, q, faqOk? f.item.f.id : best.item.label, {tipo:faqOk?'faq':'pasaje', fuentes:rotulos, principal:rotulos[0]||'', entidad:entity});
}

export { addBot, addUser, answer };
