# Plan del verificador de títulos: consulta ciudadana y verificación interna

Plan de trabajo del 3 de noviembre de 2026 para que Santiago, Fabián y la persona responsable
del Despacho sigan en paralelo desde la rama `claude/verificador-titulos`. Antes de empezar, lea
`CLAUDE.md` (reglas del proyecto), la última entrada de `HISTORIAL_SESIONES.md` y
`verificador-titulos/LEEME.md`.

## 1. Para qué

En el proceso de selección de docentes y directivos docentes, la duda más frecuente es si un
título sirve para un empleo. La respuesta depende de dos fuentes públicas: el Manual de Funciones
del MEN (Resolución 003842 de 2022 y sus modificaciones), que dice qué títulos admite cada
empleo, y el SNIES, que dice qué programa es y cómo está clasificado. En docentes hay un solo
manual nacional, no uno por entidad.

Se hacen dos flujos sobre el mismo motor:

| | A. Consulta ciudadana | B. Verificación interna |
|---|---|---|
| Meta | Reducir en un 80 % los derechos de petición sobre títulos docentes | Hacer la verificación de requisitos mínimos (VRM) y la valoración de antecedentes (VA) más rápidas y parejas entre analistas, con menos reclamaciones por criterios dispares |
| Quién la usa | Aspirantes y ciudadanía | Analistas de la CNSC y del operador |
| Pregunta | «¿Para qué empleos sirve mi título?», «¿En qué OPEC me puedo inscribir?» y «¿Me sirve para este empleo?» | «¿Este aspirante cumple el requisito de formación?» y «¿Cuánto suma en la VA?» |
| Entrada | Elige su programa de una lista (SNIES) | Tabla de títulos por inscripción, SNIES completo, manual y fecha de corte |
| Respuesta | Orientación en lenguaje claro, con la fuente literal del manual. No es la VRM | «Cumple», «No cumple» o «Revisión humana», puntaje de VA proyectado e informe CSV |
| Dónde corre | Página pública (GitHub Pages), sin cargar archivos | `verificador-titulos.html` en el equipo, sin internet |
| Datos personales | Ninguno | Solo número de inscripción y OPEC |

**Lo que pregunta la ciudadanía hoy.** Se hizo un conteo aproximado, por palabras clave, en las
614 respuestas del Despacho a derechos de petición sobre docentes que guarda el cerebro. Las
cifras no suman 614 porque una respuesta puede tocar varios temas.

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

## 2. Flujo A: consulta ciudadana

Es una sola pantalla con tres pasos:

1. **«¿Cuál es su título?»** La persona empieza a escribir y elige su programa de una lista con
   autocompletado; la lista son las 1.423 denominaciones del SNIES. Si no encuentra el suyo, puede
   escribirlo tal como figura en el diploma.
2. **La respuesta aparece de inmediato.** Es la lista de empleos para los que sirve su título,
   agrupada en docente de aula (por área), docente orientador y directivos docentes. Cada empleo
   tiene un «¿Por qué?» desplegable con el requisito de estudio de la OPEC y el numeral del
   manual.
3. **«¿En qué OPEC se puede inscribir?»** Debajo de cada empleo aparecen las OPEC del proceso
   2026 que corresponden a él. Cada una muestra la entidad territorial, el número de OPEC, las
   vacantes y la modalidad («abierta» o «reserva para personas con discapacidad»). La persona
   puede filtrar por entidad territorial. Un resumen arriba da los totales. Por ejemplo, una
   licenciatura en matemáticas del NBC «Educación» sirve para docente de matemáticas (2.201
   vacantes en 142 OPEC) y para docente de primaria (8.953 vacantes en 154 OPEC). Si quiere, la
   persona también puede elegir un empleo concreto y ver si sirve, si no sirve o si requiere
   análisis.
   En los directivos docentes (rector, coordinador y director rural), la consulta solo verifica
   el título. Por eso muestra, junto a esos empleos, el requisito de experiencia que trae la OPEC.

**Cruce con la OPEC.** El asistente ya tiene la OPEC del proceso en `herramientas/opec.json`, y
la consulta la reutiliza. Son 2.295 OPEC con 31.164 vacantes en 90 entidades, del reporte de SIMO
con corte del 9 de octubre de 2026 (`python herramientas/opec.py`, fase 9). El cruce es directo:
- la OPEC tiene exactamente 23 denominaciones de empleo, las mismas 23 del manual;
- cada denominación tiene un solo requisito de estudio en todas las entidades.

Al comparar ese requisito con la transcripción del manual (3 de noviembre de 2026), los 20
empleos docentes coinciden ítem por ítem, con dos diferencias:
- **Derecho.** La OPEC de ciencias sociales incluye «DERECHO» como título profesional admitido.
  Viene de la Resolución MEN 018278 de 2023 y no está en el texto original de la Resolución 3842
  (decisión D7).
- **Errata.** La OPEC corrige la errata «extrajeras» del manual («español y lenguas
  extranjeras»).

Para la ciudadanía, la respuesta se basa en el requisito publicado en la OPEC, que es el que rige
la inscripción, y cita el manual como origen. Antes de cada publicación hay que actualizar
`opec.json` con el último reporte de SIMO.

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
«dictamen» y en la primera versión no calcula puntajes. Siempre aclara que es una orientación y
que no reemplaza la verificación de requisitos mínimos.

**Criterios de «sencilla»:**
- una persona sin ayuda obtiene su respuesta en menos de un minuto, con el celular;
- lenguaje claro: frases cortas y sin siglas sin explicar;
- WCAG 2.1 AA: teclado, lector de pantalla, texto al 200 % y 320 px de ancho;
- se prueba con cinco aspirantes reales antes de publicar (tarea A7).

## 3. Flujo B: verificación interna

Ya existe: `verificador-titulos.html` tiene la verificación de un aspirante y la de un lote.
- **Dictamen:** para cada título dice «Cumple», «No cumple» o «Revisión humana», con la regla, el
  numeral y la hoja del manual.
- **VA:** la proyecta con las tablas del Anexo Técnico 2026 (factores 1 a 3).
- **Informe:** CSV que se abre en Excel, con una fila por título.

Falta para usarlo en un proceso real:
- **SNIES completo.** La consulta de programas del SNIES con institución, código, nivel y estado
  (B1). El catálogo de la sección 5 no trae esos datos.
- **Manual validado** (V1).
- **Decisiones D4 a D6 aplicadas en el motor** (B3).
- **Prueba piloto** con un lote real, comparada con una VRM ya hecha (B2).

## 4. Lo que ya está hecho

En la rama `claude/verificador-titulos`, sin fusionar en `master` y sin publicar:

- **Motor determinista** (`verificador-titulos/nucleo/`): ubica el título en el SNIES, lo compara
  con las reglas del manual, dictamina con motivo y fuente, y clasifica y puntúa la VA.
- **Manual transcrito** (`verificador-titulos/manual/manual-funciones-3842-2022.csv`):
  - 23 empleos y 446 reglas;
  - se genera con `python herramientas/manual_3842.py` desde `verificador-titulos/fuentes/`;
  - coincide en 309 de 312 ítems con el texto del cerebro; las tres diferencias son errores del
    OCR del cerebro;
  - todas las reglas están en «revisar» hasta que se validen;
  - incluye la Resolución MEN 018278 de 2023 (Derecho para ciencias sociales), siempre en
    «revisar».
- **Parámetros de VA 2026** (`verificador-titulos/parametros/parametros-va-docentes-2026.json`):
  factores 1 a 3 de las tablas 5.1.1 a 5.1.5 del Anexo Técnico.
- **Pruebas:** `npm run prueba:verificador`, 104 comprobaciones en verde.

## 5. Datos del SNIES recibidos

`verificador-titulos/datos/origen/snies-data.ts` es una copia sin cambios del archivo que entregó
la persona responsable el 3 de noviembre de 2026 (SHA-256 `d297f9a1…c3c`), que contiene solo
datos y ningún código ejecutable.

| Dato | Valor |
|---|---|
| Entradas | 2.163 combinaciones de programa, título otorgado y NBC |
| Denominaciones distintas | 1.423 |
| Núcleos básicos del conocimiento | 55 |
| Licenciaturas | 618 |
| Posgrados, tecnologías y técnicas | 2 entradas en total |
| Campos | `NOMBRE_DEL_PROGRAMA`, `TITULO_OTORGADO`, `NÚCLEO_BÁSICO_DEL_CONOCIMIENTO` |

- **Sirve para el flujo A:** la persona busca su programa por nombre y la herramienta conoce su
  NBC.
- **No alcanza para el flujo B:** no trae institución, código SNIES, nivel, estado ni posgrados.
- **NBC repetidos:** 151 denominaciones tienen más de un NBC; 18 son licenciaturas, como
  «Licenciatura en Matemáticas», que aparece con «Educación» y con «Matemáticas, Estadística y
  Afines». Si eso cambia el resultado, la herramienta responde «requiere análisis».
- **Registros por revisar:** hay algunos dudosos, como «Turismo Sostenible» con NBC «Educación».
- **Origen:** no consta de qué consulta del SNIES salió ni en qué fecha (D2).

## 6. Decisiones (persona responsable)

| Id | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| D1 | ¿Dónde vive la consulta ciudadana? | Página aparte (`consulta-titulos.html`) en el mismo sitio de GitHub Pages, con un botón visible desde el asistente | A6 |
| D2 | Fuente y fecha del catálogo del SNIES | Registrar de qué consulta salió y en qué fecha. La página la muestra al pie | S1 |
| D3 | Textos de la consulta y de las fichas | Santiago los redacta a partir de las respuestas a derechos de petición ya firmadas por el Despacho, y usted los aprueba (regla 1 de `CLAUDE.md`) | A3 |
| D4 | Títulos que el manual no lista (numeral 3.2) | En la consulta, la ficha correspondiente. En el analista, una nota en «No cumple» | A3, B3 |
| D5 | Títulos del exterior: el numeral 3.3 exige convalidación y el Criterio Unificado del 4 de junio de 2024 acepta la apostilla en la VRM | Confirmar con la OAJ | A3, B3 |
| D6 | Afinidad en la VA: ¿un posgrado del área que no es de educación va al factor 2? | Hoy va al factor 3. Confirmar | B3 |
| D7 | Derecho para ciencias sociales: la OPEC 2026 lo incluye, pero la sentencia del 27 de agosto de 2026 revocó la medida cautelar desde su ejecutoria, y esa ejecutoria no está acreditada | Confirmar con la OAJ si para el proceso 2026 rige lo publicado en la OPEC. Mientras tanto, «requiere análisis», citando la OPEC y la Resolución 018278 | A3 |
| D8 | ¿Qué se publica mientras haya reglas en «revisar»? | Publicar cuando estén validados los empleos con más vacantes. Los demás responden «requiere análisis» y nunca «sirve» | A6 |

## 7. Tareas

Cada tarea termina con un commit en español en la rama de su responsable y una entrada en
`BITACORA_IMPLEMENTACION.md`.

### Persona responsable: validación y decisiones

| Id | Tarea | Terminada cuando |
|---|---|---|
| V1 | Validar el manual transcrito empleo por empleo contra el PDF (`fuentes/res-3842-2022-requisitos.txt` y `fuentes/res-3842-2022-desglose.csv`) y anotar cada empleo en `fuentes/res-3842-2022-validados.txt`. Empezar por los empleos con más vacantes en la OPEC 2026 | Los 23 empleos están validados y `python herramientas/manual_3842.py` informa 23 de 23 |
| V2 | Revisar las notas «Lectura del verificador» del desglose | Cada nota queda confirmada o corregida |
| V3 | Resolver D1 a D8 | Cada decisión queda anotada aquí, con fecha |
| V4 | Aprobar los textos de la consulta (D3) | Los textos aprobados quedan en `verificador-titulos/textos-consulta.md` |
| V5 | Con Fabián, contar los derechos de petición sobre títulos docentes que llegan hoy (línea base) y definir cómo se cuentan después de publicar | La línea base queda en la bitácora, solo con cifras agregadas |

### Fabián: datos, motor y flujo interno (B)

Fabián es dueño de `verificador-titulos/nucleo/`, `herramientas/` y
`verificador-titulos/datos/`. Si Santiago necesita un cambio en el núcleo, se lo pide a él.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| S1 | Catálogo para la consulta. `herramientas/snies_catalogo.py` lee `datos/origen/snies-data.ts` como datos, sin ejecutarlo, y genera `datos/snies-denominaciones.json`. Cada denominación lleva sus títulos otorgados, sus NBC y el nivel deducido del nombre (licenciaturas e ingenierías son universitarias; «Tecnología», tecnológica), más la fuente y fecha de D2. El script informa las denominaciones con varios NBC y los registros dudosos | D2 (puede empezar y dejar la fuente pendiente) | El JSON se genera, sus cifras coinciden con la sección 5 y tiene pruebas |
| S2 | Consulta por denominación, sin institución. Agregar al núcleo `consultarTitulo(denominacion)`, que evalúa el título contra los 23 empleos y devuelve para cada uno «sirve», «no sirve» o «requiere análisis», con la regla, el numeral, la hoja y el texto literal. Si la denominación tiene varios NBC y eso cambia el resultado, responde «requiere análisis» y explica por qué | S1 | Función exportada, con pruebas en `pruebas/verificador/` y un ejemplo de uso para Santiago |
| S3 | Casos especiales. Que `consultarTitulo` indique cuál de las fichas de la sección 2 aplica | S2 | Probado con un caso por ficha |
| S4 | Cruce con la OPEC. Tabla fija de las 23 denominaciones de `herramientas/opec.json` con los 23 `empleo_id` del manual, y función `opecParaTitulo(denominacion)`, que devuelve por empleo las OPEC con entidad, número, vacantes y modalidad, más los totales. Agregar a `herramientas/manual_3842.py` (o a un script aparte) una comprobación que compare el requisito de estudio de cada OPEC con la transcripción y avise de cualquier diferencia nueva cuando se actualice `opec.json` | S2 | Las 23 denominaciones quedan mapeadas, y la comprobación informa solo «Derecho» y la errata corregida |
| B4 | En el lote del analista, deducir el empleo a partir del número de OPEC, para que la tabla de aspirantes no necesite `empleo_id` | S4 | Un lote solo con números de OPEC da los mismos dictámenes |
| B1 | Conseguir el SNIES completo para el flujo interno: programas activos e inactivos, con institución, código, nivel y estado, del portal SNIES o de datos abiertos. Registrar fuente y fecha | Ninguna | El archivo carga en `verificador-titulos.html` sin columnas faltantes |
| B2 | Prueba piloto con un lote real de una OPEC, solo con inscripción, OPEC y títulos, sin nombres ni documentos. Comparar con la VRM ya hecha | B1 y V1 de los empleos del lote | Informe en la bitácora con cifras agregadas: coincidencias, diferencias y causas |
| B3 | Aplicar en el motor las decisiones D4, D5 y D6 | V3 | Las pruebas pasan con los casos nuevos |

### Santiago: consulta ciudadana (A)

Santiago es dueño de `consulta-titulos/` (carpeta nueva) y de su archivo generado, y usa el
núcleo sin modificarlo.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| A1 | Estructura. `consulta-titulos/` con `plantilla.html`, `estilos.css` y `app.ts`, y `herramientas/construir_consulta.mjs`, que genera `consulta-titulos.html`: un solo archivo con el catálogo y el manual incrustados, sin internet ni carga de archivos. Modelo: `herramientas/construir_verificador.mjs` | S1 (mientras tanto, datos de `pruebas/verificador/`) | `npm run construir:consulta` genera el archivo |
| A2 | Buscador del título: combobox accesible (patrón ARIA) sobre las denominaciones. Tolera tildes, mayúsculas y abreviaturas («Lic.»), y funciona con teclado, lector de pantalla y celular. Si la persona no encuentra su programa, la página lo dice y sugiere revisar el diploma | A1 | Se elige un programa solo con teclado y en 320 px |
| A3 | Respuesta: lista de empleos agrupada, «¿Por qué?» con la fuente literal, OPEC de cada empleo con filtro por entidad territorial, resumen de vacantes, filtro opcional por empleo y fichas de casos especiales. Antes, Santiago redacta todos los textos en `verificador-titulos/textos-consulta.md` para V4 | S2, S3, S4, V4 | Los casos de prueba del núcleo dan lo mismo en la página |
| A4 | Aspecto del asistente: panel EBAR por configuración y CSS propio, sin tocar `vendor/` (regla 3) | A1 | Se ve como el asistente |
| A5 | Pruebas automáticas: axe sin errores (claro, oscuro, texto al 200 %), reflujo a 320 px, teclado y región viva. Archivo `pruebas/consulta_titulos.mjs`, con `pruebas/verificador_titulos.mjs` como modelo | A3 | `npm run prueba:consulta` en verde |
| A6 | Publicación: cambio en `.github/workflows/publicar.yml` y botón en el asistente, según D1 y D8. **Sin `git push` a `master`**: lo decide la persona responsable | D1, D8, V1, A5 | Solicitud de cambios abierta para revisión |
| A7 | Prueba con cinco personas que quieran concursar, con distintos títulos y con celular, y pruebas con NVDA y TalkBack. Se anota cuánto tardan y dónde se confunden | A5 | Hallazgos en la bitácora y ajustes hechos |

## 8. Orden y trabajo en paralelo

```
Persona responsable: V1 (empleos con más vacantes primero) ── V2 ── V3 ── V4 ── V5
Fabián:           S1 ── S2 ── S3 ── S4 ── B1 ── B2 ── B3 ── B4
Santiago:            A1 ── A2 ── (textos para V4) ── A3 ── A4 ── A5 ── A7 ── A6
```

- **Arranque:** S1 y A1 empiezan a la vez, y Santiago redacta los textos sin esperar a nadie.
- **Punto de encuentro:** A3 necesita S2, S3 y S4. Después de S4, Fabián sigue con el flujo
  interno (B1 a B4).
- **Ramas:** cada persona crea la suya desde `claude/verificador-titulos`
  (`santiago/consulta-ciudadana` y `fabian/datos-y-analista`) y la integra con una solicitud de
  cambios hacia `claude/verificador-titulos`, nunca directo a `master`.
- **Archivos compartidos:** en `BITACORA_IMPLEMENTACION.md` y `HISTORIAL_SESIONES.md` cada uno
  agrega entradas sin reescribir las de otros. En `package.json` cada uno agrega su script.

## 9. Reglas que no cambian

- Sin IA generativa en tiempo de ejecución: el motor es determinista.
- Lo que se muestra como fuente sale literal del manual o de los actos que lo modifican. Ninguno
  de los dos flujos redacta conclusiones jurídicas propias.
- Ningún dato personal se pide, guarda ni envía.
- WCAG 2.1 AA y «personas con discapacidad» en todo texto.
- Sin `git push` a `master` sin la decisión de la persona responsable.

## 10. Comandos

```
python herramientas/manual_3842.py        # regenera el manual desde la transcripción
npm run construir:verificador             # genera verificador-titulos.html (flujo interno)
npm run prueba:verificador                # pruebas del motor y del flujo interno (104 hoy)
```

Por crear: `python herramientas/snies_catalogo.py` (S1), `npm run construir:consulta` (A1) y
`npm run prueba:consulta` (A5).
