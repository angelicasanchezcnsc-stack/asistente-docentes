/* Motor de búsqueda de v0.1 (BM25 con grupos de sinónimos). Movido sin cambios de lógica. */
export const STOP = new Set(('a al algo algun alguna algunas alguno algunos ante antes aqui asi aun cada como con contra cual cuales de del desde donde dos el ella ellas ellos en entre era es esa esas ese eso esos esta estan estas este esto estos fue ha hay hasta la las le les lo los mas me mi mis muy ni no nos o otra otro para pero poco por porque pues que quien se segun ser si sin sobre su sus tal tambien tan tanto te tengo tiene toda todo todos tu un una uno unos usted y ya yo puedo puede debo debe hacer hace quiero saber cuando como cual cuanto cuantos cuanta cuantas mi me ha han sido esta favor hola buenas buenos dias tardes gracias necesito pasa pasaria ocurre sucede significa explica explicar informacion dice sirve tener tienen hacer deben debemos existe son estan cuales usted ustedes ese esa seria podria quisiera pregunta').split(' '));
export const SYN = {
  pagar:'pago', cargar:'cargue', subir:'cargue', adjuntar:'cargue', pesa:'peso porcentual', vale:'peso porcentual valor', presento:'presentacion presentar', asisto:'presentacion presentar', pague:'pago', pagan:'pago', paga:'pago', pagamos:'pago', ofrece:'ofertados oferta', ofrecen:'ofertados oferta', ofertan:'ofertados oferta', pago:'pago', pagos:'pago', costo:'pago valor', cuesta:'pago valor', precio:'pago valor', valor:'valor pago', plata:'pago valor',
  plaza:'vacante', plazas:'vacante', cupo:'vacante', cupos:'vacante', cargo:'empleo', cargos:'empleo', puesto:'empleo',
  examen:'prueba', examenes:'prueba', nota:'puntaje', notas:'puntaje', calificacion:'puntaje', aprobar:'aprobatorio minimo', pasar:'aprobatorio minimo', gano:'aprobatorio', ganar:'aprobatorio',
  concurso:'proceso seleccion', convocatoria:'convocatoria proceso', reclamo:'reclamacion', reclamar:'reclamacion', queja:'reclamacion',
  papeles:'documentos', documentos:'documentos documentacion', titulo:'titulo formacion', experiencia:'experiencia', cedula:'identificacion',
  fecha:'fecha cronograma', fechas:'fecha cronograma', cuando:'fecha', gratis:'gratuidad', gratuito:'gratuidad', gratuita:'gratuidad',
  discapacitado:'discapacidad', discapacitados:'discapacidad', elegible:'elegibles lista', puntos:'puntaje', porcentaje:'peso porcentual', peso:'peso porcentual'
};
export function norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9ñ]+/g,' ').trim(); }
export function stem(w){ if(/^\d+$/.test(w)) return w; if(w.length>4 && w.endsWith('es')) w=w.slice(0,-2); else if(w.length>3 && w.endsWith('s')) w=w.slice(0,-1); return w.length>6 ? w.slice(0,6) : w; }
export function toks(s, expand){
  const out=[];
  for(const w of norm(s).split(' ')){
    if(!w || STOP.has(w) || (w.length<3 && !/^\d+$/.test(w))) continue;
    out.push(stem(w));
    if(expand && SYN[w]) for(const x of SYN[w].split(' ')) out.push(stem(x));
  }
  return out;
}
export function qgroups(q){
  const out=[], seen=new Set();
  for(const w of norm(q).split(' ')){
    if(!w || STOP.has(w) || (w.length<3 && !/^\d+$/.test(w))) continue;
    const g=[stem(w)]; if(SYN[w]) for(const x of SYN[w].split(' ')) if(x) g.push(stem(x));
    if(seen.has(g[0])) continue; seen.add(g[0]); out.push([...new Set(g)]);
  }
  return out;
}
export class Index{
  constructor(items){ // items: {text, head, ...}
    this.items=items; this.df=new Map(); this.tf=[]; this.len=[]; let tot=0;
    items.forEach((it,i)=>{
      const m=new Map(); const body=toks(it.text), head=toks(it.head||'');
      for(const t of body) m.set(t,(m.get(t)||0)+1);
      for(const t of head) m.set(t,(m.get(t)||0)+2);
      this.tf.push(m); this.len.push(body.length+2*head.length); tot+=this.len[i];
      for(const t of m.keys()) this.df.set(t,(this.df.get(t)||0)+1);
    });
    this.avg=tot/Math.max(1,items.length); this.N=items.length;
  }
  idf(t){ const n=this.df.get(t)||0; return Math.log(1+(this.N-n+.5)/(n+.5)); }
  search(q, k, drop){
    const groups=qgroups(q).filter(g=>!(drop&&drop.has(g[0])));
    const qt=[...new Set(groups.flat())];
    const maxIdf=Math.log(1+(this.N+.5)/.5);
    const gw=groups.map(g=>{ const kn=g.filter(t=>this.df.has(t)); return kn.length?Math.max(...kn.map(t=>this.idf(t))):maxIdf; });
    const tot=gw.reduce((a,b)=>a+b,0)||1;
    const res=[];
    for(let i=0;i<this.N;i++){
      const m=this.tf[i]; let s=0, hit=0, w=0; const K=1.2*(.25+.75*this.len[i]/this.avg);
      groups.forEach((g,gi)=>{ let bs=0; for(const t of g){ const f=m.get(t); if(!f) continue; const v=this.idf(t)*f*2.2/(f+K); if(v>bs) bs=v; } if(bs>0){ hit++; w+=gw[gi]; s+=bs; } });
      if(s>0) res.push({i, s, cov: hit/Math.max(1,groups.length), wcov: w/tot, item:this.items[i]});
    }
    res.sort((a,b)=>b.s-a.s);
    return {res:res.slice(0,k||5), qt};
  }
}
