/* Bloque «Vacantes en la OPEC» (fase 9): vacantes por empleo y modalidad de una entidad, con el número de OPEC,
   los requisitos, las funciones y los tipos de discapacidad, tomados literal de opec.json (herramientas/opec.py).
   Las cifras salen de sumar las vacantes de cada OPEC; ninguna se escribe a mano. */
import { esc, htmlFuente } from './bitacora.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
let D = null;
let bloques = 0;

export function iniciarOpec(datos){ D = datos || null; }

/* Fecha del corte como «7 de octubre de 2026» (sin depender del idioma del sistema). */
export function fechaCorte(){
  if(!D) return '';
  const [a, m, d] = D.corte.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const cifra = (n) => n.toLocaleString('es-CO');
const vacantes = (n) => n === 1 ? '1 vacante' : `${cifra(n)} vacantes`;
const suma = (emp, modalidad) => emp.opec.filter((o) => o.modalidad === modalidad).reduce((s, o) => s + o.vacantes, 0);

function detalleEmpleo(emp){
  const T = D.textos;
  const seccion = (titulo, i) => T[i] ? `<h4>${titulo}</h4><p${titulo === 'Funciones' ? ' class="opec-funciones"' : ''}>${esc(T[i])}</p>` : '';
  const opec = emp.opec.map((o) => o.modalidad === 'reserva'
    ? `<li>OPEC ${esc(o.numero)}: ${vacantes(o.vacantes)} con reserva para personas con discapacidad. Tipos de discapacidad: ${esc(T[o.discapacidad])}</li>`
    : `<li>OPEC ${esc(o.numero)}: ${vacantes(o.vacantes)} sin reserva</li>`).join('');
  const alternativas = emp.alternativas.filter((i) => T[i]);
  return `<details class="opec-empleo"><summary>${esc(emp.denominacion)}</summary>`
    + `<h4>Número de OPEC y vacantes</h4><ul>${opec}</ul>`
    + seccion('Requisito de estudio', emp.estudio)
    + seccion('Requisito de experiencia', emp.experiencia)
    + (alternativas.length ? `<h4>Alternativa de estudio y experiencia</h4><ul>${alternativas.map((i) => `<li>${esc(T[i])}</li>`).join('')}</ul>` : '')
    + seccion('Funciones', emp.funciones)
    + `</details>`;
}

/* HTML del bloque para la entidad (nombre del acuerdo en kb.json), o cadena vacía si no está en la OPEC. */
export function bloqueOpec(entidad){
  const e = D && D.entidades[entidad];
  if(!e) return '';
  const id = 'opec' + (++bloques), fecha = fechaCorte();
  const filas = e.empleos.map((emp) => ({ emp, s: suma(emp, 'sin-reserva'), r: suma(emp, 'reserva') }));
  const ts = filas.reduce((x, f) => x + f.s, 0), tr = filas.reduce((x, f) => x + f.r, 0);
  const titulo = `Vacantes por empleo en la OPEC de ${entidad}`;
  const fila = (nombre, s, r, clase) => `<tr${clase ? ` class="${clase}"` : ''}><th scope="row">${esc(nombre)}</th><td>${cifra(s)}</td><td>${cifra(r)}</td><td>${cifra(s + r)}</td></tr>`;
  return `<section class="opec" aria-labelledby="${id}">`
    + `<h3 id="${id}">Vacantes en la OPEC</h3>`
    + `<p class="src">${htmlFuente(`OPEC del proceso de selección, ${entidad}, corte del ${fecha}`, { conBorrador: false })}</p>`
    + `<p class="hint">Cifras de la OPEC con corte del ${esc(fecha)}. Pueden ser distintas de las del proyecto de acuerdo, que es anterior.</p>`
    + `<div class="tabla-scroll" role="group" tabindex="0" aria-label="${esc(titulo)}"><table class="opec-tabla"><caption>${esc(titulo)}</caption>`
    + `<thead><tr><th scope="col">Empleo</th><th scope="col">Sin reserva</th><th scope="col">Con reserva para personas con discapacidad</th><th scope="col">Total</th></tr></thead>`
    + `<tbody>${filas.map((f) => fila(f.emp.denominacion, f.s, f.r)).join('')}${fila('Total', ts, tr, 'opec-total')}</tbody></table></div>`
    + `<details class="more opec-empleos"><summary>Requisitos, funciones y número de OPEC de cada empleo</summary>`
    + e.empleos.map(detalleEmpleo).join('')
    + `</details></section>`;
}
