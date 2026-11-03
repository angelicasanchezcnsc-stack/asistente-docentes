# Plan: consulta ciudadana «¿Mi título sirve para ser docente?»

Plan de trabajo del 3 de noviembre de 2026 para Santiago, Sebastián y la persona responsable del
Despacho, desde la rama `claude/verificador-titulos`. Antes de empezar, lea `CLAUDE.md` (reglas
del proyecto), la última entrada de `HISTORIAL_SESIONES.md` y `verificador-titulos/LEEME.md`.

## 1. Para qué

**Meta:** reducir en un 80 % los derechos de petición de personas que quieren participar en el
proceso de selección de docentes y directivos docentes y preguntan si su título les sirve.

La respuesta a esa pregunta ya está escrita en dos fuentes públicas: el Manual de Funciones del
MEN (Resolución 003842 de 2022 y sus modificaciones) y el SNIES, pero cruzarlas exige leer listas
largas de denominaciones que la mayoría de aspirantes no conoce. Por eso se hace una página
pública y sencilla que haga ese cruce y muestre la fuente.

**Lo que preguntan hoy.** Se hizo un conteo aproximado, por palabras clave, en las 614
respuestas del Despacho a derechos de petición sobre docentes que guarda el cerebro. Así se
reparten los temas:

| Tema | Respuestas |
|---|---|
| Manual de funciones o Resolución 3842 | 151 |
| «¿Mi título sirve o habilita para el empleo?» | 65 |
| Profesional no licenciado | 58 |
| Puntaje de los títulos en la valoración de antecedentes | 53 |
| «¿Qué títulos piden para el empleo?» | 52 |
| Título del exterior o convalidación | 51 |
| Normalista superior | 41 |
| SNIES o registro del programa | 23 |
| Tecnólogo en educación | 16 |

Las cifras no suman 614 porque una respuesta puede tocar varios temas. La página tiene que
resolver los temas de títulos de la lista; el puntaje de la valoración de antecedentes queda para
después (sección 8) y ya tiene preguntas frecuentes en el asistente.

## 2. Cómo se ve: una sola pantalla, tres pasos

1. **«¿Cuál es su título?»** La persona empieza a escribir y elige su programa de una lista con
   autocompletado; la lista son las 1.423 denominaciones del SNIES. Si no encuentra el suyo, puede
   escribirlo tal como figura en el diploma.
2. **La respuesta aparece de inmediato.** Es la lista de empleos para los que sirve su título,
   agrupada en docente de aula (por área), docente orientador y directivos docentes. Cada empleo
   tiene un «¿Por qué?» desplegable con el numeral del manual y el texto literal.
3. **Opcional: «¿Le interesa un empleo en particular?»** La persona elige el empleo y ve si
   sirve, si no sirve o si requiere análisis, y por qué.

Según el caso, debajo de la respuesta aparece una ficha corta con texto aprobado:
- profesional no licenciado (numeral 3.8: al terminar el período de prueba debe acreditar un
  posgrado en educación o un programa de pedagogía);
- normalista superior;
- título del exterior (convalidación);
- tecnólogo en educación (numeral 3.1);
- un posgrado no reemplaza el pregrado exigido;
- Derecho para ciencias sociales (inclusión provisional);
- título que no figura en el manual (numeral 3.2: el MEN puede conceptuar su habilitación).

**Lo que la página no hace:** no pide datos personales ni cargar archivos, no habla de
«dictamen» y no calcula puntajes. Siempre aclara que es una orientación y que no reemplaza la
verificación de requisitos mínimos.

**Criterios de «sencilla»:**
- una persona sin ayuda obtiene su respuesta en menos de un minuto, con el celular;
- lenguaje claro: frases cortas y sin siglas sin explicar;
- WCAG 2.1 AA: teclado, lector de pantalla, texto al 200 % y 320 px de ancho;
- se valida con cinco personas reales antes de publicar (tarea A7).

## 3. Lo que ya existe y se reutiliza

En la rama `claude/verificador-titulos`:

- **Motor** (`verificador-titulos/nucleo/`): compara un título con las reglas del manual y devuelve
  el resultado con su fuente. Es determinista y no usa IA.
- **Manual transcrito** (`verificador-titulos/manual/manual-funciones-3842-2022.csv`):
  - 23 empleos y 446 reglas;
  - se genera con `python herramientas/manual_3842.py`;
  - todas las reglas están en «revisar» hasta que se validen;
  - incluye la Resolución MEN 018278 de 2023 (Derecho), siempre en «revisar».
- **Catálogo del SNIES** (`verificador-titulos/datos/origen/snies-data.ts`):
  - 2.163 entradas de programa, título otorgado y NBC, con 1.423 denominaciones de pregrado;
  - no trae institución, código, nivel ni estado, y no le hacen falta a la consulta ciudadana;
  - 151 denominaciones tienen más de un NBC (18 son licenciaturas);
  - no consta de qué consulta del SNIES salió ni en qué fecha (D2).
- **Herramienta del analista** (`verificador-titulos.html`): queda como está, para uso interno. No
  se invierte más en ella hasta publicar la consulta ciudadana.

## 4. Decisiones (persona responsable)

| Id | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| D1 | ¿Dónde vive la página? | Página aparte (`consulta-titulos.html`) en el mismo sitio de GitHub Pages, con un botón visible desde el asistente. Es más simple para la persona y no arriesga el asistente | A6 |
| D2 | Fuente y fecha del catálogo del SNIES | Registrar de qué consulta salió y en qué fecha. La página la muestra al pie | S1 |
| D3 | Textos de la página y de las fichas | Santiago los redacta y usted los aprueba (regla 1 de `CLAUDE.md`). La redacción de las fichas debe partir de las respuestas a derechos de petición ya firmadas por el Despacho | A3 |
| D4 | Título del exterior: el numeral 3.3 exige convalidación y el Criterio Unificado del 4 de junio de 2024 acepta la apostilla en la VRM | Confirmar con la OAJ qué se le dice a la ciudadanía | A3 |
| D5 | Derecho para ciencias sociales: ejecutoria de la sentencia del 27 de agosto de 2026 | Pedir la constancia a la OAJ. Mientras tanto, la página responde «requiere análisis» y explica por qué | A3 |
| D6 | ¿Qué hace la página con las reglas que siguen en «revisar»? | Publicar cuando estén validados los empleos con más vacantes. Los demás responden «requiere análisis» y nunca «sirve» | A6 |

## 5. Tareas

Cada tarea termina con un commit en español en la rama de su responsable y una entrada en
`BITACORA_IMPLEMENTACION.md`.

### Persona responsable

| Id | Tarea | Terminada cuando |
|---|---|---|
| V1 | Validar el manual transcrito empleo por empleo contra el PDF (`fuentes/res-3842-2022-requisitos.txt` y `fuentes/res-3842-2022-desglose.csv`) y anotar cada empleo en `fuentes/res-3842-2022-validados.txt`. Empezar por los empleos con más vacantes en la OPEC 2026 | Están validados los empleos que se van a publicar |
| V2 | Revisar las notas «Lectura del verificador» del desglose | Cada nota queda confirmada o corregida |
| V3 | Resolver D1 a D6 | Cada decisión queda anotada aquí, con fecha |
| V4 | Aprobar los textos (D3) | Los textos aprobados quedan en `verificador-titulos/textos-consulta.md` |

### Sebastián: datos y motor

Sebastián es dueño de `verificador-titulos/nucleo/`, `herramientas/` y
`verificador-titulos/datos/`. Si Santiago necesita un cambio en el núcleo, se lo pide a él.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| S1 | Catálogo para la página. `herramientas/snies_catalogo.py` lee `datos/origen/snies-data.ts` como datos, sin ejecutarlo, y genera `datos/snies-denominaciones.json`. Cada denominación lleva sus títulos otorgados y sus NBC, sin duplicados. El script también informa las denominaciones con varios NBC y los registros dudosos (por ejemplo, «Turismo Sostenible» con NBC «Educación») | D2 (puede empezar y dejar la fuente pendiente) | El JSON se genera, sus cifras coinciden con la sección 3 y tiene pruebas |
| S2 | Consulta por denominación, sin institución. Agregar al núcleo `consultarTitulo(denominacion)`, que evalúa el título contra los 23 empleos y devuelve, para cada uno, «sirve», «no sirve» o «requiere análisis», con la regla, el numeral, la hoja y el texto literal. Si la denominación tiene varios NBC y eso cambia el resultado, responde «requiere análisis» y lo explica | S1 | Función exportada, con pruebas en `pruebas/verificador/` y un ejemplo de uso para Santiago |
| S3 | Casos especiales. Que `consultarTitulo` devuelva cuál de las fichas de la sección 2 aplica: normalista, tecnólogo, posgrado, exterior, Derecho, no licenciado o no listado | S2 | Probado con un caso por ficha |
| S4 | Medición. Con la persona responsable, contar en la bandeja actual los derechos de petición sobre títulos docentes (la línea base) y definir cómo se cuentan después de publicar | Ninguna | La línea base queda en la bitácora, solo con cifras agregadas |

### Santiago: la página

Santiago es dueño de `consulta-titulos/` (carpeta nueva) y de su archivo generado, y usa el
núcleo sin modificarlo.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| A1 | Estructura. `consulta-titulos/` con `plantilla.html`, `estilos.css` y `app.ts`, y `herramientas/construir_consulta.mjs`, que genera `consulta-titulos.html`: un solo archivo con el catálogo y el manual incrustados, sin internet. Modelo: `herramientas/construir_verificador.mjs` | S1 (mientras tanto, datos de `pruebas/verificador/`) | `npm run construir:consulta` genera el archivo |
| A2 | Buscador del título: combobox accesible (patrón ARIA) sobre las denominaciones. Tolera tildes, mayúsculas y abreviaturas («Lic.»), y funciona con teclado, lector de pantalla y celular | A1 | Se elige un programa solo con teclado y en 320 px |
| A3 | Respuesta: lista de empleos agrupada, «¿Por qué?» con la fuente literal, filtro opcional por empleo y fichas de casos especiales. Antes, Santiago redacta todos los textos en `verificador-titulos/textos-consulta.md` para V4 | S2, S3, V4 | Los casos de prueba del núcleo dan lo mismo en la página |
| A4 | Aspecto del asistente: panel EBAR por configuración y CSS propio, sin tocar `vendor/` (regla 3) | A1 | Se ve como el asistente |
| A5 | Pruebas automáticas: axe sin errores (claro, oscuro, texto al 200 %), reflujo a 320 px, teclado y región viva. Archivo `pruebas/consulta_titulos.mjs`, con `pruebas/verificador_titulos.mjs` como modelo | A3 | `npm run prueba:consulta` en verde |
| A6 | Publicación: cambio en `.github/workflows/publicar.yml` y botón en el asistente, según D1. **Sin `git push` a `master`**: lo decide la persona responsable | D1, D6, V1, A5 | Solicitud de cambios abierta para revisión |
| A7 | Prueba con cinco personas que quieran concursar, con distintos títulos, con celular y al menos una con lector de pantalla. Se anota cuánto tardan y dónde se confunden | A5 | Hallazgos en la bitácora y ajustes hechos |

## 6. Orden

```
Persona responsable: V1 (empleos con más vacantes primero) ── V2 ── V3 ── V4
Sebastián:           S1 ── S2 ── S3          S4 (en paralelo)
Santiago:            A1 ── A2 ── (textos para V4) ── A3 ── A4 ── A5 ── A7 ── A6
```

- **Arranque:** S1 y A1 empiezan a la vez y Santiago redacta los textos sin esperar a nadie.
- **Punto de encuentro:** A3 necesita S2 y S3.
- **Ramas:** cada persona crea la suya desde `claude/verificador-titulos`
  (`santiago/consulta-ciudadana` y `sebastian/datos-consulta`) y la integra con una solicitud de
  cambios hacia `claude/verificador-titulos`, nunca directo a `master`.
- **Archivos compartidos:** en `BITACORA_IMPLEMENTACION.md` y `HISTORIAL_SESIONES.md` cada uno
  agrega entradas sin reescribir las de otros. En `package.json` cada uno agrega su script.

## 7. Reglas que no cambian

- Sin IA generativa en tiempo de ejecución.
- Lo que se muestra como fuente sale literal del manual o de los actos que lo modifican. La
  página no redacta conclusiones jurídicas propias.
- Ningún dato personal se pide, guarda ni envía.
- WCAG 2.1 AA y «personas con discapacidad» en todo texto.
- Sin `git push` a `master` sin la decisión de la persona responsable.

## 8. Después de publicar (no ahora)

- Medir con S4 cuántos derechos de petición sobre títulos llegan antes y después.
- Puntaje de los títulos en la valoración de antecedentes: el motor ya lo calcula con las tablas
  del Anexo Técnico 2026, pero se deja fuera de la primera versión para que la página sea
  sencilla.
- Herramienta del analista: SNIES completo con institución y código, y prueba piloto con un lote.

## 9. Comandos

```
python herramientas/manual_3842.py        # regenera el manual desde la transcripción
npm run construir:verificador             # herramienta del analista
npm run prueba:verificador                # pruebas del motor y del analista (104 hoy)
```

Por crear: `python herramientas/snies_catalogo.py` (S1), `npm run construir:consulta` (A1) y
`npm run prueba:consulta` (A5).
