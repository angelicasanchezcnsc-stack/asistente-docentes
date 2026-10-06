/* Base de conocimiento: pasajes, alcance por entidad, preguntas frecuentes y detección de entidad.
   Movido sin cambios de lógica desde plantilla.html (v0.1). */
import { Index, norm } from './motor-busqueda.js';

export function crearBase(KB, FAQ, reservados) {
  // Los pasajes de los temas en reserva de Sala Plena no entran al índice ni a las fuentes de las preguntas frecuentes.
  const excluido = (p) => Boolean(reservados) && reservados.excluir(p.text);
  const T = KB.texts;
  const anexo = KB.docs.find(d=>d.kind==='anexo');
  const acuerdos = KB.docs.filter(d=>d.kind==='acuerdo');
  const N = KB.nAcuerdos;
  const firstLine = t => t.split('\n')[0];
  function passagesOfDoc(doc){ return doc.chunks.map(([l,t,p])=>({doc:doc.name, entity:doc.entity, kind:doc.kind, label:l, part:p, text:T[t], head:firstLine(T[t])+' '+l})).filter(p=>!excluido(p)); }
  const anexoP = passagesOfDoc(anexo);
  const commonP = [], specificP = [];
  for(const [l,t,p,n] of KB.modal){
    const o={doc:'Proyectos de Acuerdo de convocatoria', entity:'*', kind:'acuerdo', label:l, part:p, text:T[t], head:firstLine(T[t])+' '+l, n};
    if(excluido(o)) continue;
    (n >= N/2 ? commonP : specificP).push(o);
  }
  const idxCache = new Map();
  function scopeIndex(entity){
    const key = entity || '*';
    if(idxCache.has(key)) return idxCache.get(key);
    let items;
    if(entity){ const d=acuerdos.find(x=>x.entity===entity); items=anexoP.concat(passagesOfDoc(d)); }
    else items=anexoP.concat(commonP);
    const ix=new Index(items); idxCache.set(key, ix); return ix;
  }
  const specIndex = new Index(specificP);
  const faqIndex = new Index(FAQ.map(f=>({text:f.pregunta+' '+f.claves, head:f.pregunta, f})));
  function findPassage(entity, ref){
    const label=ref.rotulo;
    if(ref.tipo==='anexo') return anexoP.find(p=>p.label===label && p.part===0);
    if(entity){ const d=acuerdos.find(x=>x.entity===entity); return passagesOfDoc(d).find(p=>p.label===label && p.part===0); }
    return commonP.concat(specificP).find(p=>p.label===label && p.part===0);
  }

  /* Entidades */
  const entKeys = acuerdos.map(d=>{ const m=d.entity.match(/(?:Departamental|Distrital|Municipal|Colegio) de(?:l)? (.+)$/i); const full=norm(m?m[1]:d.entity).replace(/^(la|el) /,''); const last=full.split(' ').slice(-1)[0]; return {e:d.entity, k:full, keys:[...new Set([full,last])].filter(x=>x.length>3)}; });
  function detectEntity(q){
    const nq=' '+norm(q)+' '; const hits=entKeys.filter(x=>x.keys.some(k=>nq.includes(' '+k+' ')));
    return hits.length===1 ? hits[0].e : null;
  }
  const glosario = KB.glosario || [];
  const nombreAnexo = anexo.name;
  return { KB, FAQ, glosario, nombreAnexo, N, acuerdos, firstLine, scopeIndex, specIndex, faqIndex, findPassage, entKeys, detectEntity };
}
