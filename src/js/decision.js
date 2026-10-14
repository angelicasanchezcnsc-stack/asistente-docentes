/* Decisión de qué responder (fase 12): función pura, sin DOM ni bitácora. La usan answer (respuestas.js) para dibujar
   y la calibración de umbrales en Node (herramientas/calibrar_umbrales.mjs). El orden de decisión es el de siempre:
   tema reservado → pregunta frecuente → «Depende de su entidad» → pasaje → «No encontrado». Desde la fase 13, antes de todo,
   los mensajes sociales («hola», «gracias»…) y, si el mensaje empieza por un saludo, la pregunta sin el saludo. */
import { stem, toks } from './motor-busqueda.js';
import { clasificarSocial, quitarSaludo } from './conversacion.js';
import { UMBRALES } from './umbrales.js';

export function crearDecisor(base, reservados) {
  const { entKeys, detectEntity, scopeIndex, specIndex, faqIndex, findPassage } = base;
  const entityTokens = (e) => { if (!e) return null; const k = entKeys.find((x) => x.e === e); return new Set(toks((k ? k.k : '') + ' ' + e)); };

  /** Decide la respuesta a `q` con la entidad elegida (o vacía) y los umbrales dados. */
  return function decidir(q, entidadElegida = '', u = UMBRALES) {
    const categoria = clasificarSocial(q);
    if (categoria) return { tipo: 'conversacion', categoria, entidad: entidadElegida, rotulos: [], principal: '' };
    q = quitarSaludo(q);
    if (reservados && reservados.detectar(q)) return { tipo: 'tema-reservado', entidad: entidadElegida, rotulos: [], principal: '' };
    let entidad = entidadElegida, detectada = null;
    const det = detectEntity(q);
    if (det && det !== entidad) { entidad = det; detectada = det; }
    const drop = entityTokens(entidad) || new Set();
    for (const x of ['secret', 'educac', 'departamental', 'municipal', 'distrital', 'entida']) drop.add(stem(x));
    const r = scopeIndex(entidad).search(q, 5, drop);
    const f = faqIndex.search(q, 1, drop).res[0];
    const best = r.res[0];
    const faqOk = !!(f && f.cov >= u.faqCov && f.wcov >= u.faqWcov);
    const passOk = !!(best && best.wcov >= u.pasajeWcov && best.s >= u.pasajeS);
    const comun = { entidad, detectada, drop, qt: r.qt, best };
    if (!faqOk && !entidad) {
      const sp = specIndex.search(q, 1, drop).res[0];
      if (sp && sp.wcov >= u.especificidad && (!best || best.wcov < u.pasajeWcov)) return { tipo: 'depende-entidad', especifico: sp.item, rotulos: [], principal: '', ...comun };
    }
    if (!faqOk && !passOk) {
      return { tipo: 'no-encontrado', parecidas: faqIndex.search(q, 3, drop).res.filter((x) => x.cov >= u.parecidas).map((x) => x.item.f),
        cercano: best && best.wcov >= u.cercano ? best.item : null, rotulos: [], principal: '', ...comun };
    }
    if (faqOk && f.item.f.requiereEntidad && !entidad) return { tipo: 'depende-entidad', faq: f.item.f, rotulos: [], principal: '', ...comun };
    const used = new Set();
    let srcs = [];
    if (faqOk) { srcs = f.item.f.fuentes.map((ref) => findPassage(entidad, ref)).filter(Boolean); for (const p of srcs) used.add(p.label + '|' + p.kind); }
    else used.add(best.item.label + '|' + best.item.kind);
    const relacionadas = r.res.filter((x) => x.wcov >= u.relacionadas && !used.has(x.item.label + '|' + x.item.kind)).slice(0, 2).map((x) => x.item);
    const rotulos = (faqOk ? srcs : [best.item]).concat(relacionadas).map((p) => p.label);
    return { tipo: faqOk ? 'faq' : 'pasaje', faq: faqOk ? f.item.f : null, srcs, pasaje: faqOk ? null : best.item, relacionadas, rotulos, principal: rotulos[0] || '', ...comun };
  };
}
