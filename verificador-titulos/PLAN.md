# Plan del verificador de títulos: consulta ciudadana y verificación del analista

Plan de trabajo del 3 de noviembre de 2026 para que Santiago, Sebastián y la persona responsable
del Despacho sigan en paralelo desde la rama `claude/verificador-titulos`. Antes de empezar, lea
`CLAUDE.md` (reglas del proyecto), la última entrada de `HISTORIAL_SESIONES.md` y
`verificador-titulos/LEEME.md`.

## 1. Qué se quiere resolver

En el proceso de selección de docentes y directivos docentes, la duda más frecuente es si un
título sirve para un empleo. La respuesta depende de dos fuentes: el SNIES, que dice qué
programa es y cómo está clasificado, y el Manual de Funciones del MEN (Resolución 003842 de
2022 y sus modificaciones), que dice qué títulos admite cada empleo. En docentes hay un solo
manual nacional, no uno por entidad.

Hay dos flujos con el mismo motor:

| | A. Consulta ciudadana | B. Verificación del analista |
|---|---|---|
| Quién la usa | Aspirantes y ciudadanía | Analistas de la CNSC y del operador |
| Pregunta | «¿Mi título sirve para este empleo?» y «¿Para qué empleos sirve mi título?» | «¿Este aspirante cumple el requisito de formación?» y «¿Cuánto suma en la VA?» |
| Entrada | Elige su programa de una lista (SNIES) y, si quiere, el empleo | Tabla de títulos por inscripción, SNIES completo, manual y fecha de corte |
| Respuesta | Orientación con la fuente literal del manual. No es la VRM | Dictamen «Cumple», «No cumple» o «Revisión humana», puntaje de VA proyectado e informe CSV |
| Dónde corre | Página pública (GitHub Pages), sin cargar archivos | `verificador-titulos.html` en el equipo, sin internet |
| Datos personales | Ninguno | Solo número de inscripción y OPEC |

## 2. Lo que ya está hecho

En la rama `claude/verificador-titulos`, sin fusionar en `master` y sin publicar:

- **Motor determinista** (`verificador-titulos/nucleo/`):
  - ubica el título en el SNIES;
  - lo compara con las reglas del manual;
  - dictamina con motivo y fuente;
  - clasifica y puntúa la VA.
- **Página del analista** (`verificador-titulos.html`): un aspirante o un lote; informe CSV.
- **Manual transcrito** (`verificador-titulos/manual/manual-funciones-3842-2022.csv`):
  - 23 empleos y 446 reglas;
  - se genera con `python herramientas/manual_3842.py` desde `verificador-titulos/fuentes/`;
  - todas las reglas están en «revisar» hasta que se validen;
  - incluye la Resolución MEN 018278 de 2023 (Derecho para ciencias sociales), siempre en «revisar».
- **Parámetros de VA del proceso 2026** (`verificador-titulos/parametros/parametros-va-docentes-2026.json`): factores 1 a 3 de las tablas 5.1.1 a 5.1.5 del Anexo Técnico.
- **Pruebas:** `npm run prueba:verificador`, 104 comprobaciones en verde.

## 3. Datos del SNIES recibidos

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

**Qué permite.** Es un catálogo de denominaciones de pregrado universitario. Alcanza para el
flujo A: la persona busca su programa por nombre y la herramienta conoce su NBC.

**Qué no permite.**
- No trae institución, código SNIES, nivel de formación, estado del programa ni campo CINE. Por
  eso no alcanza para el flujo B, que necesita confirmar el programa de una institución concreta.
- No trae posgrados, así que no sirve para clasificar especializaciones, maestrías ni doctorados
  en la VA.
- 151 denominaciones aparecen con más de un NBC; 18 son licenciaturas. Un ejemplo es
  «Licenciatura en Matemáticas», con «Educación» y con «Matemáticas, Estadística y Afines». En
  esos casos la herramienta no puede elegir un NBC y lo dice.
- Hay registros que hay que revisar, como «Turismo Sostenible» con NBC «Educación».
- No se sabe de qué consulta salió ni en qué fecha (decisión D2).

## 4. Decisiones abiertas (persona responsable)

| Id | Decisión | Recomendación | Bloquea |
|---|---|---|---|
| D1 | ¿La consulta ciudadana es una sección del asistente publicado o una página aparte? | Página aparte (`consulta-titulos.html`) publicada junto al asistente, con un enlace desde él. Aísla el riesgo y no toca el asistente que ya funciona | A5, A8 |
| D2 | Fuente y fecha de corte de `snies-data.ts` | Registrar de qué consulta del SNIES salió y en qué fecha. Se muestra en cada respuesta | S1 |
| D3 | Textos de la consulta ciudadana | Santiago los redacta y la persona responsable los aprueba (regla 1 de `CLAUDE.md`) | A4 |
| D4 | Títulos que el manual no lista (numeral 3.2) | En la consulta: «no figura en el manual; el MEN puede conceptuar su habilitación». En el analista: nota en «No cumple» | A3, B3 |
| D5 | Títulos del exterior: el numeral 3.3 exige convalidación y el Criterio Unificado del 4 de junio de 2024 acepta la apostilla en la VRM | Confirmar con la OAJ | B3 |
| D6 | Afinidad en la VA: ¿un posgrado del área que no es de educación va al factor 2? | Hoy va al factor 3. Confirmar | B3 |
| D7 | Ejecutoria de la sentencia del 27 de agosto de 2026 (Derecho para ciencias sociales) | Pedir la constancia a la OAJ y ajustar `fuentes/modificaciones-3842.csv` | V3 |

## 5. Tareas

Cada tarea tiene un responsable, de qué depende y cuándo se da por terminada. Una tarea termina
con un commit en español en la rama de su responsable y una entrada en
`BITACORA_IMPLEMENTACION.md`.

### Persona responsable: validación y decisiones

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| V1 | Validar el manual transcrito, empleo por empleo, contra el PDF de la Resolución 3842 (`fuentes/res-3842-2022-requisitos.txt` y `fuentes/res-3842-2022-desglose.csv`). Cada empleo validado se anota en `fuentes/res-3842-2022-validados.txt`. Empezar por los empleos con más vacantes en la OPEC | Ninguna | Los 23 empleos están en `validados.txt` y `python herramientas/manual_3842.py` informa 23 de 23 |
| V2 | Revisar las notas «Lectura del verificador» del desglose | Ninguna | Cada una está confirmada o corregida |
| V3 | Resolver D1 a D7 | Ninguna | Cada decisión queda anotada en este plan, con fecha |
| V4 | Aprobar los textos de la consulta ciudadana (D3) | A4 | Los textos aprobados quedan en `verificador-titulos/textos-consulta.md` |

### Sebastián: datos del SNIES y flujo del analista (B)

Sebastián es dueño de `verificador-titulos/nucleo/`, `herramientas/` y
`verificador-titulos/datos/`. Si Santiago necesita un cambio en el núcleo, se lo pide a él.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| S1 | Conversor del catálogo. Hacer `herramientas/snies_catalogo.py`, que lee `datos/origen/snies-data.ts` como datos, sin ejecutarlo, y genera `datos/snies-denominaciones.json`. El JSON lleva la denominación, el título otorgado, la lista de NBC, el nivel deducido del nombre (licenciatura e ingeniería son universitarias; «Tecnología» es tecnológica) y la fuente y fecha de D2. Debe informar las denominaciones con más de un NBC | D2 (puede empezar sin ella y dejar la fuente pendiente) | El JSON se genera, las cifras coinciden con la sección 3 y hay pruebas en `pruebas/verificador/` |
| S2 | Resolución por denominación sin institución. Ajustar `nucleo/snies.ts` para cargar el catálogo de S1 y resolver solo por denominación. Si la denominación tiene varios NBC y eso cambia el resultado, se responde «depende del programa» | S1 | Las pruebas del núcleo pasan, con casos de NBC ambiguo |
| S3 | Función de consulta inversa en el núcleo: dado un título, evaluar los 23 empleos y devolver en cuáles sirve, en cuáles «requiere análisis» y la regla y fuente de cada uno | S2 | Función exportada y probada. La usa Santiago en A3 |
| B1 | Conseguir el SNIES completo para el analista: consulta de programas activos e inactivos, con institución, código, nivel y estado, desde el portal SNIES o datos abiertos. Registrar fuente y fecha | Ninguna | El archivo carga en `verificador-titulos.html` sin columnas faltantes |
| B2 | Prueba piloto con un lote real de una OPEC, solo con inscripción, OPEC y títulos, sin nombres ni documentos. Comparar con la VRM ya hecha | B1, V1 de los empleos del lote | Hay un informe en la bitácora con cifras agregadas: coincidencias, diferencias y causas |
| B3 | Aplicar en el motor las decisiones D4, D5 y D6 | V3 | Las pruebas pasan con los nuevos casos |

### Santiago: consulta ciudadana (A)

Santiago es dueño de `consulta-titulos/` (carpeta nueva) y de su archivo generado, y usa el
núcleo sin modificarlo.

| Id | Tarea | Depende de | Terminada cuando |
|---|---|---|---|
| A1 | Estructura de la página: `consulta-titulos/` con su `plantilla.html`, `estilos.css` y `app.ts`, y `herramientas/construir_consulta.mjs`, que genera `consulta-titulos.html`. Es un solo archivo, con el catálogo de S1 y el manual incrustados, sin internet y sin carga de archivos. Se puede tomar como modelo `herramientas/construir_verificador.mjs` | S1 (mientras tanto, usar `pruebas/verificador/` como datos) | `npm run construir:consulta` genera el archivo |
| A2 | Buscador accesible del programa: un combobox con autocompletado sobre las 1.423 denominaciones, que tolere tildes y mayúsculas y funcione con teclado y lector de pantalla (patrón combobox de ARIA). Si la persona no encuentra su programa, la página lo dice y sugiere revisar el diploma | A1 | Se puede elegir un programa solo con teclado |
| A3 | Las dos preguntas: (1) elegir el empleo y ver si el título sirve; (2) ver la lista de empleos en los que sirve, con S3. Cada resultado muestra el numeral, el ítem, la hoja y el texto literal del manual | S2, S3, A2 | Los casos de prueba de `nucleo.prueba.ts` dan el mismo resultado en la página |
| A4 | Redactar los textos de interfaz para que los apruebe la persona responsable (D3): bienvenida, ayuda, cómo leer el resultado, «requiere análisis», «no figura en el manual», aviso de que la consulta no reemplaza la VRM y fuente y fecha de los datos | Ninguna | Borrador en `verificador-titulos/textos-consulta.md`, entregado a V4 |
| A5 | Integración visual con el asistente según D1. Panel EBAR por configuración y CSS propio, sin tocar `vendor/` (regla 3). Enlace desde el asistente si así se decide | D1 | La página se ve como el asistente y pasa axe |
| A6 | Accesibilidad: axe sin errores (claro, oscuro, texto al 200 %), reflujo a 320 px, recorrido con teclado y región viva para el resultado. `pruebas/consulta_titulos.mjs`, siguiendo el modelo de `pruebas/verificador_titulos.mjs` | A3 | `npm run prueba:consulta` en verde |
| A7 | Pruebas manuales con NVDA y TalkBack | A6 | Resultados anotados en la bitácora |
| A8 | Preparar la publicación: cambio en `.github/workflows/publicar.yml` para publicar también `consulta-titulos.html`. **Sin `git push`**: lo decide la persona responsable | D1, V1, V4, A6 | Solicitud de cambios abierta para revisión |

**Regla para publicar.** La consulta ciudadana se publica cuando los empleos que muestra estén
validados (V1). Las reglas en «revisar» se muestran como «requiere análisis», nunca como
«sirve».

## 6. Orden y trabajo en paralelo

```
Persona responsable: V1 ─────────────── V2 ── V3 ── V4
Sebastián:           S1 ── S2 ── S3 ── B1 ── B2 ── B3
Santiago:            A1 ── A4 ── A2 ──(S3)── A3 ── A5 ── A6 ── A7 ── A8
```

- **Primera semana:** S1 y A1 arrancan a la vez. A4 (textos) avanza sin esperar a nadie.
- **Punto de encuentro:** A3 necesita S2 y S3. Sebastián entrega S3 con un ejemplo de uso en
  `nucleo.prueba.ts`.
- **Ramas.** Cada persona crea su rama desde `claude/verificador-titulos`:
  `santiago/consulta-ciudadana` y `sebastian/snies-analista`. Se integran por solicitud de
  cambios hacia `claude/verificador-titulos`, nunca directo a `master`.
- **Archivos compartidos.** `BITACORA_IMPLEMENTACION.md` y `HISTORIAL_SESIONES.md` se editan
  agregando entradas nuevas al final o arriba, sin reescribir las de otros, para evitar
  conflictos. `package.json` lo tocan ambos: se agrega un script por persona y se resuelve al
  integrar.

## 7. Reglas que no cambian

- Sin IA generativa en tiempo de ejecución: el motor es determinista.
- Ningún texto jurídico redactado por la herramienta. Lo que se muestra como fuente sale literal
  del manual o de los actos que lo modifican.
- Ningún dato personal se pide, guarda ni envía.
- WCAG 2.1 AA y «personas con discapacidad» en todo texto.
- Sin `git push` a `master` sin la decisión de la persona responsable.

## 8. Comandos

```
python herramientas/manual_3842.py        # regenera el manual desde la transcripción
npm run construir:verificador             # genera verificador-titulos.html
npm run prueba:verificador                # pruebas del verificador (104 hoy)
```

Por crear: `python herramientas/snies_catalogo.py` (S1), `npm run construir:consulta` (A1) y
`npm run prueba:consulta` (A6).
