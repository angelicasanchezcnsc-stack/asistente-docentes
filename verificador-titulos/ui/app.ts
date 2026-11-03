/**
 * Interfaz del verificador. Todo ocurre en el navegador: los archivos no salen del equipo y
 * la página funciona sin internet (herramientas/construir_verificador.mjs la empaqueta en un
 * solo HTML). Se construye el DOM con nodos (nunca innerHTML con datos de los archivos).
 */
import { CatalogoSnies, NOMBRE_NIVEL } from '../nucleo/snies';
import { manualDesdeJson, manualDesdeTabla, type Manual } from '../nucleo/manual';
import { aspirantesDesdeTabla, informeCsv, procesarLote, resumir, type ResultadoAspirante } from '../nucleo/lote';
import { RESULTADO_LEGIBLE, verificarAspirante, type Resultado, type TituloDeclarado } from '../nucleo/motor';
import { leerArchivoTabla, type Tabla } from '../nucleo/tabla';
import { leerFecha } from '../nucleo/texto';
import { CATEGORIA_LEGIBLE, clasificarVA, leerParametrosVA, type ParametrosVA } from '../nucleo/va';

type Hijo = Node | string | null | undefined | false;

function h(tag: string, attrs: Record<string, string> = {}, ...hijos: Hijo[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const c of hijos) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const estado: {
  snies: CatalogoSnies | null;
  manual: Manual | null;
  va: ParametrosVA | null;
  aspirantes: Tabla | null;
  resultados: ResultadoAspirante[];
} = { snies: null, manual: null, va: null, aspirantes: null, resultados: [] };

function avisar(id: string, texto: string, error = false) {
  const el = $(id);
  el.textContent = texto;
  el.classList.toggle('error', error);
}

async function leerTabla(f: File, pistas: string[]): Promise<Tabla> {
  const binario = /\.xlsx$/i.test(f.name);
  return leerArchivoTabla(f.name, binario ? await f.arrayBuffer() : new Uint8Array(await f.arrayBuffer()), pistas);
}

function fechaCorte(): string | null {
  return leerFecha($<HTMLInputElement>('f-corte').value);
}

// ── Fuentes ────────────────────────────────────────────────────────────────

$<HTMLInputElement>('f-snies').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  avisar('e-snies', 'Leyendo…');
  try {
    estado.snies = CatalogoSnies.desdeTabla(await leerTabla(f, ['codigo snies', 'programa']));
    const faltan = estado.snies.columnasFaltantes();
    avisar('e-snies', `${estado.snies.programas.length.toLocaleString('es-CO')} programas de ${estado.snies.totalInstituciones.toLocaleString('es-CO')} instituciones.`
      + (faltan.length ? ` Faltan columnas: ${faltan.join(', ')}.` : ''), faltan.length > 0);
  } catch (err) {
    estado.snies = null;
    avisar('e-snies', (err as Error).message, true);
  }
  actualizarBotones();
});

$<HTMLInputElement>('f-manual').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  avisar('e-manual', 'Leyendo…');
  try {
    estado.manual = /\.json$/i.test(f.name)
      ? manualDesdeJson(await f.text())
      : manualDesdeTabla(await leerTabla(f, ['empleo', 'modo']), f.name);
    const reglas = [...estado.manual.empleos.values()].reduce((n, x) => n + x.reglas.length, 0);
    const adv = estado.manual.advertencias;
    avisar('e-manual', `${estado.manual.empleos.size} empleos, ${reglas} reglas.${adv.length ? ` ${adv.length} advertencia(s): ${adv.slice(0, 3).join(' ')}${adv.length > 3 ? ' …' : ''}` : ''}`, adv.length > 0);
    llenarEmpleos();
  } catch (err) {
    estado.manual = null;
    avisar('e-manual', (err as Error).message, true);
  }
  actualizarBotones();
});

$<HTMLInputElement>('f-va').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) { estado.va = null; return; }
  try {
    estado.va = leerParametrosVA(await f.text());
    avisar('e-va', `Parámetros cargados${estado.va.fuente ? `: ${estado.va.fuente}` : ''}. Tope del factor: ${estado.va.topeFactor}.`);
  } catch (err) {
    estado.va = null;
    avisar('e-va', (err as Error).message, true);
  }
});

function llenarEmpleos() {
  const sel = $<HTMLSelectElement>('i-empleo');
  sel.replaceChildren();
  if (!estado.manual) {
    sel.append(h('option', { value: '' }, 'Cargue primero el manual'));
    sel.disabled = true;
    return;
  }
  const empleos = [...estado.manual.empleos.values()].sort((a, b) => `${a.denominacion} ${a.area}`.localeCompare(`${b.denominacion} ${b.area}`, 'es'));
  for (const e of empleos) sel.append(h('option', { value: e.id }, [e.denominacion, e.area].filter(Boolean).join(' — ') + ` (${e.id})`));
  sel.disabled = false;
}

function actualizarBotones() {
  $<HTMLButtonElement>('l-procesar').disabled = !(estado.manual && estado.aspirantes);
}

// ── Pestañas ───────────────────────────────────────────────────────────────

const pestanas = [['tab-ind', 'p-ind'], ['tab-lote', 'p-lote']] as const;
function activar(i: number, foco = false) {
  pestanas.forEach(([t, p], j) => {
    const tab = $(t);
    tab.setAttribute('aria-selected', String(i === j));
    tab.tabIndex = i === j ? 0 : -1;
    $(p).classList.toggle('oculto', i !== j);
    if (i === j && foco) tab.focus();
  });
}
pestanas.forEach(([t], i) => {
  $(t).addEventListener('click', () => activar(i));
  $(t).addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
      ev.preventDefault();
      activar((i + (ev.key === 'ArrowRight' ? 1 : -1) + pestanas.length) % pestanas.length, true);
    }
  });
});

// ── Un aspirante ───────────────────────────────────────────────────────────

let contador = 0;
function campo(etiqueta: string, control: HTMLElement): HTMLElement {
  const id = `c${++contador}`;
  control.id = id;
  return h('div', {}, h('label', { for: id }, etiqueta), control);
}

function agregarTitulo() {
  const n = $('i-titulos').children.length + 1;
  const cuadro = h('fieldset', { class: 'titulo-fila' });
  const quitar = h('button', { type: 'button', class: 'secundario' }, 'Quitar este título');
  quitar.addEventListener('click', () => cuadro.remove());
  const nivel = h('select', {}, ...['', 'Universitaria', 'Normalista superior', 'Tecnológica', 'Técnica profesional', 'Especialización', 'Maestría', 'Doctorado']
    .map((v) => h('option', { value: v }, v || 'Según el SNIES')));
  nivel.setAttribute('data-k', 'nivel');
  cuadro.append(
    h('legend', {}, `Título ${n}`),
    h('div', { class: 'rejilla' },
      campo('Institución', h('input', { type: 'text', 'data-k': 'institucion', autocomplete: 'off' })),
      campo('Denominación del título (como figura en el diploma)', h('input', { type: 'text', 'data-k': 'programa', autocomplete: 'off', required: '' })),
      campo('Código SNIES (si consta)', h('input', { type: 'text', 'data-k': 'codigoSnies', inputmode: 'numeric', autocomplete: 'off' })),
      campo('Fecha de grado', h('input', { type: 'date', 'data-k': 'fechaGrado' })),
      campo('Nivel', nivel),
      campo('País (vacío si es Colombia)', h('input', { type: 'text', 'data-k': 'pais', autocomplete: 'off' })),
    ),
    h('div', { class: 'acciones' },
      h('label', {}, h('input', { type: 'checkbox', 'data-k': 'apostillado' }), ' Apostillado o legalizado'),
      h('label', {}, h('input', { type: 'checkbox', 'data-k': 'convalidado' }), ' Convalidado por el MEN'),
      quitar,
    ),
  );
  $('i-titulos').append(cuadro);
}

function leerTitulos(): TituloDeclarado[] {
  return [...$('i-titulos').querySelectorAll('fieldset')].map((fs) => {
    const v = (k: string) => {
      const el = fs.querySelector(`[data-k="${k}"]`) as HTMLInputElement | null;
      return el ? (el.type === 'checkbox' ? (el.checked ? 'si' : '') : el.value.trim()) : '';
    };
    return {
      institucion: v('institucion'),
      programa: v('programa'),
      codigoSnies: v('codigoSnies'),
      fechaGrado: leerFecha(v('fechaGrado')),
      nivel: v('nivel'),
      pais: v('pais'),
      apostillado: !!v('apostillado'),
      convalidado: !!v('convalidado'),
    };
  }).filter((t) => t.programa);
}

function insignia(r: Resultado): HTMLElement {
  return h('span', { class: `insignia ${r}` }, RESULTADO_LEGIBLE[r]);
}

function vistaDictamen(x: ResultadoAspirante): HTMLElement {
  const d = x.dictamen;
  const caja = h('article', { class: 'dictamen' },
    h('h3', {}, 'Dictamen: ', insignia(d.resultado)),
    h('p', {}, d.motivo),
    d.observacionSugerida ? h('p', { class: 'tenue' }, h('strong', {}, 'Texto de apoyo: '), d.observacionSugerida) : null,
  );
  for (const t of d.titulos) {
    const c = t.snies?.elegido?.programa;
    const cva = x.va.titulos.find((v) => v.indice === t.indice);
    const uso = t.indice === d.tituloRequisito ? 'Acredita el requisito mínimo' : '';
    caja.append(h('details', { open: '' },
      h('summary', {}, `«${t.titulo.programa}» — `,
        d.resultado === 'CUMPLE' && !uso && cva && cva.categoria !== 'NO_VALORABLE'
          ? `No se usa para el requisito mínimo · VA: ${CATEGORIA_LEGIBLE[cva.categoria]}`
          : insignia(t.resultado),
        uso ? ` ${uso}` : ''),
      h('ul', {},
        h('li', {}, `Institución declarada: ${t.titulo.institucion || '—'} · Fecha de grado: ${t.titulo.fechaGrado || '—'}`),
        c ? h('li', {}, `SNIES ${c.codigoSnies || 's/c'}: ${c.nombrePrograma} · ${c.nombreInstitucion} · Título: ${c.tituloOtorgado || '—'} · NBC: ${c.nbc || '—'} · ${NOMBRE_NIVEL[t.nivel]} · Confianza ${Math.round((t.snies!.elegido!.confianza) * 100)} %`)
          : h('li', {}, t.extranjero ? 'Título del exterior: no aplica SNIES.' : `Nivel: ${NOMBRE_NIVEL[t.nivel]}. Programa no ubicado en el SNIES.`),
        ...t.motivos.map((m) => h('li', {}, m)),
        ...t.alertas.map((a) => h('li', { class: 'alerta' }, `Alerta: ${a}`)),
        cva ? h('li', {}, `Valoración de antecedentes: ${CATEGORIA_LEGIBLE[cva.categoria]}. ${cva.motivo}${cva.puntos !== null ? ` Puntos: ${cva.puntos}.` : ''}`) : null,
      ),
    ));
  }
  if (x.va.puntajeProyectado !== null) {
    caja.append(h('p', {}, h('strong', {}, `Educación formal (VA) proyectada: ${x.va.puntajeProyectado}`), x.va.fuente ? ` — ${x.va.fuente}` : ''));
  }
  for (const a of x.va.advertencias) caja.append(h('p', { class: 'tenue' }, a));
  return caja;
}

$('i-agregar').addEventListener('click', agregarTitulo);
$('i-verificar').addEventListener('click', () => {
  const salida = $('i-resultado');
  salida.replaceChildren();
  if (!estado.manual) {
    salida.append(h('p', { class: 'estado error' }, 'Cargue el manual de funciones.'));
    return;
  }
  const titulos = leerTitulos();
  if (!titulos.length) {
    salida.append(h('p', { class: 'estado error' }, 'Escriba al menos la denominación de un título.'));
    return;
  }
  const corte = fechaCorte();
  const dictamen = verificarAspirante(
    { inscripcion: $<HTMLInputElement>('i-inscripcion').value.trim() || '—', empleoId: $<HTMLSelectElement>('i-empleo').value, titulos },
    estado.manual, estado.snies, { fechaCorte: corte },
  );
  const x = { dictamen, va: clasificarVA(dictamen, corte, estado.va) };
  if (!estado.snies) salida.append(h('p', { class: 'estado error' }, 'Sin SNIES cargado: el resultado se basa solo en la denominación del diploma.'));
  if (!corte) salida.append(h('p', { class: 'estado error' }, 'Sin fecha de cierre de inscripciones: no se verificó la fecha de grado.'));
  salida.append(vistaDictamen(x));
});

// ── Lote ───────────────────────────────────────────────────────────────────

$<HTMLInputElement>('f-aspirantes').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    estado.aspirantes = await leerTabla(f, ['inscripcion']);
    avisar('e-asp', `${estado.aspirantes.filas.length.toLocaleString('es-CO')} filas leídas.`);
  } catch (err) {
    estado.aspirantes = null;
    avisar('e-asp', (err as Error).message, true);
  }
  actualizarBotones();
});

$('l-procesar').addEventListener('click', () => {
  if (!estado.manual || !estado.aspirantes) return;
  const salida = $('l-resultado');
  const { aspirantes, errores } = aspirantesDesdeTabla(estado.aspirantes);
  estado.resultados = procesarLote(aspirantes, estado.manual, estado.snies, { fechaCorte: fechaCorte() }, estado.va);
  const r = resumir(estado.resultados);
  $<HTMLButtonElement>('l-descargar').disabled = !estado.resultados.length;

  const cifra = (n: number, t: string, clase = '') => h('div', { class: `cifra ${clase}` }, h('strong', {}, n.toLocaleString('es-CO')), t);
  const tabla = h('table', {},
    h('caption', { class: 'sr' }, 'Dictamen por aspirante'),
    h('thead', {}, h('tr', {}, ...['Inscripción', 'OPEC', 'Empleo', 'Dictamen', 'Motivo', 'Títulos'].map((x) => h('th', { scope: 'col' }, x)))),
  );
  const cuerpo = h('tbody');
  for (const x of estado.resultados.slice(0, 500)) {
    const d = x.dictamen;
    const detalle = h('details', {}, h('summary', {}, `${d.titulos.length} título(s)`), vistaDictamen(x));
    cuerpo.append(h('tr', {},
      h('td', {}, d.aspirante.inscripcion), h('td', {}, d.aspirante.opec || ''),
      h('td', {}, d.empleo ? [d.empleo.denominacion, d.empleo.area].filter(Boolean).join(' — ') : d.aspirante.empleoId),
      h('td', {}, insignia(d.resultado)), h('td', {}, d.motivo), h('td', {}, detalle),
    ));
  }
  tabla.append(cuerpo);
  // Los avisos opcionales valen null cuando no aplican: se descartan (replaceChildren escribiría «null»).
  salida.replaceChildren(...[
    h('div', { class: 'cifras' },
      cifra(r.total, 'aspirantes'), cifra(r.cumple, 'cumplen'), cifra(r.noCumple, 'no cumplen'), cifra(r.revision, 'a revisión humana')),
    errores.length ? h('details', {}, h('summary', { class: 'alerta' }, `${errores.length} fila(s) con problemas de carga`),
      h('ul', {}, ...errores.map((x) => h('li', {}, `Fila ${x.fila}: ${x.mensaje}`)))) : null,
    !fechaCorte() ? h('p', { class: 'estado error' }, 'Sin fecha de cierre de inscripciones: no se verificaron las fechas de grado.') : null,
    estado.resultados.length > 500 ? h('p', { class: 'tenue' }, 'Se muestran los primeros 500; el informe CSV los contiene todos.') : null,
    h('div', { class: 'tabla-envoltura' }, tabla),
  ].filter((x): x is HTMLElement => x !== null));
});

function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const a = h('a', { href: URL.createObjectURL(blob), download: nombre }) as HTMLAnchorElement;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

$('l-descargar').addEventListener('click', () => {
  descargar(`verificacion-titulos-docentes-${new Date().toISOString().slice(0, 10)}.csv`, informeCsv(estado.resultados), 'text/csv;charset=utf-8');
});

// Plantillas incrustadas al construir (verificador-titulos/plantillas/).
const plantillas: Record<string, string> = JSON.parse(document.getElementById('datos-plantillas')?.textContent || '{}');
document.querySelectorAll<HTMLButtonElement>('[data-plantilla]').forEach((b) => {
  b.addEventListener('click', () => {
    const nombre = b.dataset.plantilla!;
    const texto = plantillas[nombre];
    if (texto === undefined) return;
    descargar(nombre, nombre.endsWith('.csv') ? '\uFEFF' + texto : texto, nombre.endsWith('.csv') ? 'text/csv;charset=utf-8' : 'application/json');
  });
});

agregarTitulo();
