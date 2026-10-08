/* Dibujo de respuestas y decisión de qué responder (answer). Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { norm, stem, toks } from './motor-busqueda.js';
import { $, esc, setStatus, logGap, silenciarBitacora, htmlFuente } from './bitacora.js';
import { enlazarGlosario } from './glosario.js';
import { MENSAJE_RESERVADO } from './reservados.js';
import { crearBuscadorEntidad } from './entidades.js';
import { bloqueOpec, fechaCorte } from './opec.js';

let N, entSel, logEl, entKeys, detectEntity, scopeIndex, specIndex, faqIndex, findPassage, firstLine, alAgregarRespuesta, alResponder, reservados, alElegirEntidad, enviarPregunta, entidades, clavesEntidad;
let reproduciendo=false;
const NOTA_VALIDEZ='Versión accesible para consulta. Rige el texto del acto administrativo que publique la CNSC.';
const INSTRUCCION_ENTIDAD='Escriba el nombre de su entidad y elíjala de la lista: el asistente volverá a responder con el texto de su acuerdo.';
const notaValidez=()=>`<p class="hint nota-validez">${NOTA_VALIDEZ}</p>`;
/* Fase 11: texto oficial plegado, con su encabezado y la nota de validez dentro. */
const textoOficialPlegado=(rotulo, bloques)=>`<details class="more texto-oficial"><summary>Ver texto oficial (${esc(rotulo)})</summary><h3>Texto oficial</h3>${bloques}${notaValidez()}</details>`;

export function iniciarRespuestas(base, ctx){
  ({ N, entKeys, detectEntity, scopeIndex, specIndex, faqIndex, findPassage, firstLine } = base);
  ({ entSel, logEl, alAgregarRespuesta, alResponder, reservados, alElegirEntidad, enviarPregunta } = ctx);
  entidades = base.acuerdos.map(d=>d.entity);
  clavesEntidad = new Map(entKeys.map(x=>[x.e, x.k]));
}

function sourceLabel(p, {conBorrador=true}={}){
  if(p.kind==='anexo') return htmlFuente(`${p.doc}, ${p.label}`, {conBorrador});
  if(p.entity && p.entity!=='*') return htmlFuente(`Proyecto de Acuerdo de ${p.entity}, ${p.label}`, {conBorrador});
  return htmlFuente(`Proyectos de Acuerdo de convocatoria, ${p.label}`, {comun:`común a ${p.n||N} de ${N} acuerdos`, conBorrador});
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
function renderOfficial(text){
  const lines=text.split('\n'); let html=''; let i=0;
  const esTitulo=l=>!!l && /[A-ZÁÉÍÓÚÑ]/.test(l) && l===l.toUpperCase();
  while(i<lines.length){
    // «TABLA No. N» (con su título en mayúsculas, si lo trae) es el título de la tabla que sigue: no se repite como párrafo.
    let titulo='';
    if(lines[i].startsWith('TABLA No.')){
      if(lines[i+1] && lines[i+1].includes(' | ')){ titulo=lines[i]; i+=1; }
      else if(esTitulo(lines[i+1]) && lines[i+2] && lines[i+2].includes(' | ')){ titulo=lines[i]+': '+lines[i+1]; i+=2; }
    }
    if(lines[i].includes(' | ')){
      const rows=[]; while(i<lines.length && lines[i].includes(' | ')){ rows.push(lines[i].split(' | ')); i++; }
      const [h,...b]=rows;
      html+=`<div class="tabla-scroll" role="group" tabindex="0" aria-label="${esc(titulo||'Tabla')}"><table>`+(titulo?`<caption>${esc(titulo)}</caption>`:'')+'<thead><tr>'+h.map(c=>`<th scope="col">${esc(c)}</th>`).join('')+'</tr></thead><tbody>'+b.map(r=>'<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';
    } else { html+=`<p>${esc(lines[i])}</p>`; i++; }
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
function addBot(html, speech, q, topSrc, meta, destino){
  const id='m'+(++msgId); const d=document.createElement('article'); d.className='msg bot'; d.setAttribute('aria-labelledby',id+'h');
  if(meta){ d.dataset.tipo=meta.tipo; d.dataset.fuentes=(meta.fuentes||[]).join(' | '); d.dataset.entidad=meta.entidad||''; d.dataset.fuentePrincipal=meta.principal||''; }
  const nivel=destino?'h2':'h3'; // el saludo va arriba de los temas, antes de cualquier h2: su encabezado oculto es de nivel 2
  // Fase 11: acciones y opinión en una sola fila (.pie-respuesta); el saludo solo lleva «Escuchar».
  const acciones=`<button class="btn ghost" type="button" data-speak aria-pressed="false" hidden>Escuchar</button>`+(destino?'':`<button class="btn ghost" type="button" data-copy>Copiar</button><button class="btn ghost" type="button" data-print>Imprimir</button>`);
  d.innerHTML=`<${nivel} id="${id}h" class="sr-only">Respuesta del asistente</${nivel}>`+html+
   `<div class="pie-respuesta"><div class="actions" data-a11y-omitir>${acciones}</div>`+
   (q?`<div class="opinion" role="group" aria-labelledby="${id}-op" data-a11y-omitir><span id="${id}-op">¿Le sirvió esta respuesta?</span><button class="btn ghost" type="button" data-ok>Sí</button><button class="btn ghost" type="button" data-no>No</button></div>`:'')+`</div><p class="hint sin-voz" data-a11y-omitir hidden>Este equipo no tiene instalada una voz en español. En Windows puede agregarla en Configuración, Hora e idioma, Voz; en Android y en iPhone, en los ajustes de accesibilidad o de texto a voz.</p>`;
  (destino||logEl).appendChild(d);
  const sitio=d.querySelector('.buscador-entidad-sitio');
  if(sitio) sitio.replaceWith(crearBuscadorEntidad({ id:id+'-be', entidades, claves:clavesEntidad, alElegir:ent=>alElegirEntidad(meta.pregunta, ent) }));
  d.querySelectorAll('.pregunta-parecida').forEach(b=>{ b.onclick=()=>enviarPregunta(b.dataset.pregunta); });
  if(meta) enlazarGlosario(d);
  const imprimir=d.querySelector('[data-print]'); if(imprimir) imprimir.onclick=()=>imprimirRespuesta(d);
  alAgregarRespuesta(d);
  const copiar=d.querySelector('[data-copy]');
  // Copia también lo plegado (texto oficial, OPEC, otras fuentes), salvo los empleos de la OPEC cerrados; luego todo vuelve a su estado.
  if(copiar) copiar.onclick=()=>{ const cerrados=Array.from(d.querySelectorAll('details:not([open]):not(.opec-empleo)')); cerrados.forEach(x=>x.setAttribute('open','')); const fuera=Array.from(d.querySelectorAll('.pie-respuesta,.sin-voz')); const antes=fuera.map(e=>e.style.display); fuera.forEach(e=>{ e.style.display='none'; }); const txt=d.innerText.trim(); fuera.forEach((e,i)=>{ e.style.display=antes[i]; }); cerrados.forEach(x=>x.removeAttribute('open')); (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>setStatus('Respuesta copiada.'),()=>setStatus('No se pudo copiar.')); };
  if(q){
    d.querySelector('[data-ok]').onclick=e=>{ setStatus('Gracias por su opinión.'); e.currentTarget.parentNode.querySelectorAll('[data-ok],[data-no]').forEach(b=>b.disabled=true); };
    d.querySelector('[data-no]').onclick=e=>{ logGap(q,'No le sirvió la respuesta',topSrc); setStatus('Gracias por su opinión.'); e.currentTarget.parentNode.querySelectorAll('[data-ok],[data-no]').forEach(b=>b.disabled=true); };
  }
  // Solo las respuestas: desplazar la bienvenida al cargar mueve el punto de partida del teclado y Tab saltaría el enlace «Saltar a escribir la pregunta».
  if(meta) d.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth', block:'start'});
  if(meta && !reproduciendo && alResponder) alResponder(d);
}
function passageBlock(p, open, {fuente='completa'}={}){
  const long=p.text.length>900;
  const body=renderOfficial(p.text);
  // fuente: 'ninguna' (ya se mostró arriba), 'sin-borrador' o 'completa'
  return (fuente==='ninguna'?'':`<p class="src">${sourceLabel(p,{conBorrador:fuente==='completa'})}</p>`)+(long?`<details class="more"${open?' open':''}><summary>Ver texto oficial completo (${esc(p.label)})</summary><div class="official">${body}</div></details>`:`<div class="official">${body}</div>`);
}
/* Preguntas frecuentes parecidas (cov >= 0.5; umbral solo de esta sugerencia, no del motor). */
function preguntasParecidas(q, drop){
  const sug=faqIndex.search(q,3,drop).res.filter(x=>x.cov>=.5);
  if(!sug.length) return '';
  return `<h3>Preguntas parecidas</h3><ul class="parecidas">`+sug.map(x=>`<li><button type="button" class="btn pregunta-parecida" data-pregunta="${esc(x.item.f.pregunta)}">${esc(x.item.f.pregunta)}</button></li>`).join('')+`</ul>`;
}
function entityTokens(e){ if(!e) return null; const k=entKeys.find(x=>x.e===e); return new Set(toks((k?k.k:'')+' '+e)); }
function answer(q){
  const tema=reservados && reservados.detectar(q);
  if(tema){
    logGap(q,'Tema reservado','');
    addBot(`<h3>Tema reservado</h3><p class="plain">${esc(MENSAJE_RESERVADO)}</p>`, MENSAJE_RESERVADO, null, null, {tipo:'tema-reservado', fuentes:[], principal:'', entidad:entSel.value});
    return;
  }
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
      const html=`<h3>Depende de su entidad</h3><p class="plain">Esta información cambia según la entidad territorial certificada (${esc(sp.item.label)} de cada acuerdo).</p><p>${INSTRUCCION_ENTIDAD}</p><div class="buscador-entidad-sitio"></div>`;
      addBot(html, `Esta información cambia según la entidad territorial certificada. ${INSTRUCCION_ENTIDAD}`, null, null, {tipo:'depende-entidad', fuentes:[], entidad:entity, pregunta:q});
      return;
    }
  }
  if(!faqOk && !passOk){
    logGap(q,'Sin respuesta en las fuentes', best?`${best.item.label} (${best.item.kind})`:'');
    const html=`<h3>No encontrado</h3><p class="plain">No encontré esta respuesta en los documentos del proceso que tengo disponibles. No voy a responder sin una fuente.</p><p>Puede intentar con otras palabras, elegir uno de los temas o consultar los canales de atención de la CNSC.</p>`+preguntasParecidas(q,drop)+(best&&best.wcov>=.3?`<details class="more"><summary>Texto más cercano que encontré (puede no responder su pregunta)</summary>${passageBlock(best.item,true)}</details>`:'');
    addBot(note+html, 'No encontré esta respuesta en los documentos del proceso. Puede intentar con otras palabras o consultar los canales de atención de la CNSC.', null, null, {tipo:'no-encontrado', fuentes:[], entidad:entity});
    return;
  }
  let html=note, speech='', srcs=[];
  const used=new Set();
  if(faqOk && f.item.f.requiereEntidad && !entity){
    const it=f.item.f;
    addBot(`<h3>Depende de su entidad</h3><p class="plain">${esc(it.sinEntidad||'Esta información cambia según la entidad territorial certificada.')}</p><p>${INSTRUCCION_ENTIDAD}</p><div class="buscador-entidad-sitio"></div>`, (it.sinEntidad||'Esta información cambia según la entidad.')+' '+INSTRUCCION_ENTIDAD, null, null, {tipo:'depende-entidad', fuentes:[], entidad:entity, pregunta:q});
    return;
  }
  if(faqOk){
    const it=f.item.f;
    srcs=it.fuentes.map(ref=>findPassage(entity,ref)).filter(Boolean);
    const resp=it.respuesta.replace('{entidad}', entity||'');
    // Orden fijo: respuesta corta, fuente en una línea, aclaración, texto oficial y nota de validez.
    // Fase 11: a la vista, la respuesta corta, la fuente y la aclaración; el texto oficial y la nota de validez, plegados.
    html+=`<div class="resumen"><h3 class="sr-only">En pocas palabras</h3><p class="plain">${esc(resp)}</p></div>`+(srcs.length?`<p class="src">${sourceLabel(srcs[0])}</p>`:'')+`<p class="hint">${esc(it.estado)}. Respuesta frecuente redactada a partir del texto oficial.</p>`+(srcs.length?textoOficialPlegado(srcs[0].label, srcs.map((p,i)=>{ used.add(p.label+'|'+p.kind); return passageBlock(p,true,{fuente:i===0?'ninguna':'sin-borrador'}); }).join('')):notaValidez());
    speech=resp+' '+srcs.map(sourceSpeech).join(' ');
  } else {
    const p=best.item; const ks=keySentences(p.text,qt,2);
    // Con frases clave, el texto completo va plegado; sin ellas, el texto oficial es la respuesta y queda a la vista.
    html+=(ks.length?`<h3>Lo más relevante del texto oficial</h3><div class="official">`+ks.map(s=>`<p>${highlight(esc(s),qt)}</p>`).join('')+`</div>`:'')+`<p class="src">${sourceLabel(p)}</p>`+(ks.length?textoOficialPlegado(p.label, passageBlock(p,true,{fuente:'ninguna'})):`<h3>Texto oficial</h3>`+passageBlock(p,true,{fuente:'ninguna'})+notaValidez());
    used.add(p.label+'|'+p.kind);
    speech=(ks.length?ks.join(' '):firstLine(p.text))+' '+sourceSpeech(p);
  }
  // Fase 9: si la fuente principal es el artículo 8 del acuerdo de la entidad, se agregan sus vacantes según la OPEC.
  const principal=faqOk? srcs[0] : best.item;
  if(entity && principal && principal.kind==='acuerdo' && principal.entity===entity && principal.label==='Artículo 8') html+=bloqueOpec(entity);
  const rel=r.res.filter(x=>x.wcov>=.5 && !used.has(x.item.label+'|'+x.item.kind)).slice(0,2);
  if(rel.length) html+=`<details class="more relacionadas"><summary>Otras fuentes relacionadas (${rel.length})</summary>`+rel.map(x=>passageBlock(x.item,true)).join('<hr style="border:0;border-top:1px solid var(--borde)">')+`</details>`;
  const rotulos=(faqOk? srcs : [best.item]).concat(rel.map(x=>x.item)).map(p=>p.label);
  addBot(html, speech, q, faqOk? f.item.f.id : best.item.label, {tipo:faqOk?'faq':'pasaje', fuentes:rotulos, principal:rotulos[0]||'', entidad:entity});
}

/* Imprime solo esta respuesta: impresion.css oculta lo demás y los desplegables se abren mientras dura la impresión. */
function imprimirRespuesta(articulo){
  // Los empleos de la OPEC que estén cerrados se imprimen cerrados (sus funciones son largas).
  const cerrados=Array.from(articulo.querySelectorAll('details:not([open]):not(.opec-empleo)'));
  cerrados.forEach(d=>d.setAttribute('open',''));
  articulo.classList.add('imprimiendo'); document.documentElement.classList.add('imprimiendo-respuesta');
  const fin=()=>{
    window.removeEventListener('afterprint',fin);
    articulo.classList.remove('imprimiendo'); document.documentElement.classList.remove('imprimiendo-respuesta');
    cerrados.forEach(d=>d.removeAttribute('open'));
  };
  window.addEventListener('afterprint',fin);
  window.print();
}

/* Vuelve a responder, en el mismo orden, las preguntas de una conversación (el motor es determinista).
   No lee en voz alta ni registra en la bitácora. */
function reproducirConversacion(items){
  reproduciendo=true; silenciarBitacora(true);
  try{ for(const it of items){ entSel.value=it.entidad||''; addUser(it.q); answer(it.q); } }
  finally{ reproduciendo=false; silenciarBitacora(false); }
}

/* Saludo del chat: una sola lista de cuatro párrafos de la que salen el texto visible y el que se lee en voz alta.
   N es la cantidad de acuerdos de kb.json y la fecha es el corte de opec.json (nunca escritos a mano). */
function saludoDelChat(n){
  const p=[
    'Hola. Soy el asistente del proceso de selección de Docentes y Directivos Docentes.',
    fechaCorte()
      ? `Respondo con los proyectos de acuerdo de las ${n} entidades, con el proyecto de anexo técnico y con la OPEC del ${fechaCorte()}. En cada respuesta le muestro el texto oficial y de dónde sale.`
      : `Respondo con los proyectos de acuerdo de las ${n} entidades y con el proyecto de anexo técnico. En cada respuesta le muestro el texto oficial y de dónde sale.`,
    'Puede elegir un tema o escribir su pregunta. Si la respuesta depende de su entidad, se la pediré en ese momento.',
    'Para cambiar el tamaño de la letra, el contraste o escuchar las respuestas, use el botón Accesibilidad.'
  ];
  // Fase 11: a la vista, la presentación y «Elija un tema o escriba su pregunta.»; el resto, tras «Cómo respondo».
  const visible=[p[0], 'Elija un tema o escriba su pregunta.'];
  return { html:`<p class="plain"><strong>${esc(visible[0])}</strong></p><p>${esc(visible[1])}</p><details class="more saludo-mas"><summary>Cómo respondo</summary>`+p.slice(1).map(t=>`<p>${esc(t)}</p>`).join('')+`</details>`, speech:visible.join(' ') };
}

export { addBot, addUser, answer, reproducirConversacion, saludoDelChat };
