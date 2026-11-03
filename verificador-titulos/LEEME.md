# Verificador de títulos docentes

Herramienta de apoyo para la verificación de requisitos mínimos (VRM) y la Valoración de
Antecedentes (VA) en los procesos de selección de **docentes y directivos docentes**.

Para cada título que aporta el aspirante:

1. **Lo ubica en el SNIES**: programa, institución, título otorgado, nivel de formación,
   núcleo básico del conocimiento (NBC) y campo CINE.
2. **Lo compara con el Manual de Funciones, Requisitos y Competencias** para el empleo al que
   se inscribió.
3. **Emite un dictamen**: *Cumple*, *No cumple* o *Revisión humana*, con la regla del manual y
   la fuente que lo sustentan.
4. **Lo clasifica para la VA**: título del requisito mínimo, pregrado adicional,
   especialización, maestría o doctorado, con la relación probable con el empleo y, si se
   cargan los parámetros del Anexo Técnico, el puntaje proyectado.

Es una pieza **independiente del asistente**: tiene su propio archivo (`verificador-titulos.html`), su propio código (`verificador-titulos/`) y sus propias pruebas. No lee ni modifica `src/`, `kb.json`, `opec.json` ni `asistente-docentes.html`, y el flujo de publicación en GitHub Pages no lo publica (solo publica `asistente-docentes.html`).

El resultado es un **insumo para el analista**. La decisión de la VRM y de la VA la toma y
firma una persona, y la observación de SIMO se copia del catálogo autorizado. El motor no usa
inteligencia artificial: es determinista, así que las mismas entradas siempre dan el mismo
resultado.

## Cómo se usa

### En el navegador

Abrir `verificador-titulos.html` con doble clic en Chrome o Edge. Es un solo archivo: no
necesita servidor ni internet (la tipografía y las plantillas van incrustadas). Los archivos se
procesan en el navegador y **no se envían a ningún servidor**.

1. Cargar el archivo de programas del SNIES, el manual de funciones y la fecha de cierre de
   inscripciones de la etapa. Los parámetros de VA son opcionales.
2. **Un aspirante**: elegir el empleo, escribir los títulos tal como figuran en el diploma y
   pulsar *Verificar*.
3. **Lote de aspirantes**: cargar la tabla de títulos (una fila por título), pulsar *Procesar
   lote* y descargar el informe en CSV, que se abre directamente en Excel.

### En la terminal (lotes grandes)

```bash
npm run verificar-titulos -- --snies programas-snies.xlsx --manual manual-funciones.csv --aspirantes aspirantes.csv --corte 15/12/2026 --va parametros-va.json --salida informe.csv
```

Genera `informe.csv`, con una fila por título, e `informe.json`, con el detalle completo.

## Archivos de entrada

Las plantillas están en `verificador-titulos/plantillas/` y también se pueden descargar
desde la página (botones «Descargar plantilla» y «Plantilla»).

### 1. Programas del SNIES

Se usa la consulta de programas exportada del SNIES del Ministerio de Educación, en `.xlsx` o
`.csv`. Debe incluir los programas **activos e inactivos**, porque un título otorgado mientras
el programa tenía registro sigue siendo válido. La herramienta reconoce los nombres de columna
de la exportación del portal y del conjunto de datos abiertos, por ejemplo «CÓDIGO SNIES DEL
PROGRAMA», «NOMBRE DEL PROGRAMA», «TÍTULO OTORGADO», «NOMBRE INSTITUCIÓN», «NIVEL DE
FORMACIÓN», «NÚCLEO BÁSICO DEL CONOCIMIENTO» y «CINE F 2013 AC CAMPO AMPLIO». Si el archivo
empieza con filas de título, la herramienta busca el encabezado por su cuenta.

El SNIES acredita que el **programa** existe y cómo está clasificado. No acredita que la
persona se graduó: eso lo prueba el diploma o el acta de grado.

### 2. Manual de funciones

La herramienta **no trae el contenido del manual**. El Despacho lo transcribe desde el texto
vigente, es decir, la Resolución MEN 003842 de 2022 y sus modificaciones en la versión a la que
remita el Anexo Técnico del proceso. Así ningún requisito queda escrito de memoria en el
programa, y un cambio del MEN se aplica editando una tabla.

**Manual transcrito de la Resolución 003842 de 2022.** El archivo que se carga es
`verificador-titulos/manual/manual-funciones-3842-2022.csv`. Tiene 23 empleos y 445 reglas, y
lo genera `python herramientas/manual_3842.py` a partir de dos fuentes:

- `verificador-titulos/fuentes/res-3842-2022-requisitos.txt` es la transcripción literal de los
  requisitos de formación académica (numerales 1.2.2.1, 1.2.2.2, 1.3.2, 2.1.4.1 a 2.1.4.19 y
  2.2.4), con la hoja de cada ítem. Se hizo con OCR (`herramientas/ocr_windows.ps1`) y se cotejó
  con la imagen de cada hoja.
- `verificador-titulos/fuentes/res-3842-2022-desglose.csv` tiene las reglas de los ítems que
  no caben en una sola: los que tienen «o», «y/o», listas de ingenierías, «y afines», erratas o
  remisiones al numeral 3.1.

El script convierte cada ítem así:

- con «(solo, con otra opción o con énfasis)» o sus variantes, regla `CONTIENE`;
- sin esa expresión, regla `EXACTA`;
- «Normalista superior», regla `NORMALISTA`;
- lo demás, regla del desglose. Si un ítem necesita desglose y no lo tiene, el script se
  detiene.

Cada regla cita el numeral, el ítem y la hoja. Cuando el valor de la regla difiere del texto,
la nota trae el texto literal del manual. Las notas que dicen «Lectura del verificador» son
interpretaciones que debe confirmar la persona responsable.

**Las reglas salen en estado `revisar`.** Mientras no se validen, toda coincidencia va a
revisión humana. La validación se hace empleo por empleo:

1. Cotejar con el PDF la transcripción y el desglose del empleo.
2. Agregar su `empleo_id` a `verificador-titulos/fuentes/res-3842-2022-validados.txt`.
3. Correr de nuevo `python herramientas/manual_3842.py`. Las reglas de ese empleo salen en
   `vigente`.

No se edita el estado a mano en la tabla generada, porque el script la reescribe.

Queda fuera del manual transcrito:

- los requisitos de experiencia de los directivos docentes;
- la media técnica (numeral 3.5), cuyo perfil determina el rector;
- cualquier modificación posterior distinta de la Resolución MEN 018278 de 2023.

**Modificaciones.** `verificador-titulos/fuentes/modificaciones-3842.csv` lleva las reglas de
actos posteriores, con su propio estado, que no cambia al validar el empleo. Hoy tiene una: la
Resolución MEN 018278 de 2023, que incluyó provisionalmente Derecho para ciencias sociales
(numeral 2.1.4.4). Va siempre en `revisar`, porque la sentencia del Consejo de Estado del 27 de
agosto de 2026 revocó la medida cautelar desde su ejecutoria y esa ejecutoria no está
acreditada. Así, un título de Derecho para ciencias sociales sale en revisión humana, con esa
explicación.

**Cotejo con el cerebro.** El 3 de noviembre de 2026 se cotejó la transcripción con el texto
completo de la Resolución 3842 que guarda el cerebro del Despacho: 309 de 312 ítems coinciden
literalmente. En los tres restantes el error está en el OCR del cerebro y la imagen del PDF
confirma la transcripción:
- en 2.1.4.5, ítems 11 y 17, el cerebro tiene caracteres sueltos («uamarénasoo», «entasis»);
- en 2.1.4.8, profesional ítem 2, al cerebro le falta «física» en la lista de ingenierías.

Cada fila de la tabla es una denominación o un criterio aceptado para un empleo:

| Columna | Contenido |
|---|---|
| `empleo_id` | Identificador del empleo, el mismo que se usa en la tabla de aspirantes |
| `empleo`, `area` | Denominación del empleo y área o asignatura |
| `modo` | Tipo de regla (ver la tabla siguiente) |
| `valor` | La denominación, los términos, el NBC o el nivel |
| `niveles` | Niveles de formación admitidos. Por defecto, `universitaria` (pregrado) |
| `excluye` | Frases que impiden aplicar la regla, separadas por `\|` |
| `estado` | `vigente` (se aplica), `revisar` (si coincide, va a revisión humana) o `inactiva` (no se aplica) |
| `fuente` | Numeral del manual. Es obligatorio en la práctica: aparece en el informe |
| `nota` | Aclaración que se imprime junto al motivo |

| Modo | El título cumple si… |
|---|---|
| `EXACTA` | su denominación es la indicada |
| `CONTIENE` | contiene la denominación exigida, aunque lleve un término adicional («Licenciatura en Matemáticas y Física» contiene «Licenciatura en Matemáticas») |
| `TERMINOS` | contiene todas las palabras indicadas, separadas por `+`, en cualquier orden |
| `NBC` | el SNIES clasifica el programa en ese núcleo básico del conocimiento |
| `CAMPO` | el SNIES lo ubica en ese campo CINE (amplio, específico o detallado) |
| `NIVEL` | es de ese nivel de formación. Sirve para requisitos como «licenciado o profesional» |
| `NORMALISTA` | es un título de normalista superior, que no figura en el SNIES |
| `EXCLUYE` | (al revés) el título que contenga esa denominación **no** sirve para el empleo, salvo que una regla `EXACTA` lo admita |

El estado `revisar` sirve para las denominaciones cuya aplicación depende de una decisión
pendiente. Por ejemplo, el título de Derecho para Ciencias Sociales mientras no esté acreditada
la ejecutoria de la sentencia del Consejo de Estado del 27 de agosto de 2026 que revocó la
medida cautelar ejecutada por la Resolución MEN 018278 de 2023. En esos casos la herramienta no
decide: envía el caso a revisión humana.

El manual también puede cargarse como JSON: `{ "titulo": "…", "version": "…", "reglas": [ {
"empleo_id": "…", "modo": "…", "valor": "…", … } ] }`.

### 3. Títulos de los aspirantes (lote)

Va una fila por título, con estas columnas: `inscripcion`, `opec`, `empleo_id`, `folio`,
`institucion`, `programa` (la denominación como figura en el diploma), `codigo_snies` (si
consta), `nivel` (opcional), `fecha_grado`, `pais` (vacío si es Colombia), `convalidado` y
`apostillado`. Las filas con la misma inscripción y el mismo empleo se agrupan en un solo
aspirante. **No se piden nombres ni documentos de identidad**, y el informe tampoco los
incluye.

### 4. Parámetros de VA (opcional)

Es un JSON con los puntajes de educación formal del Anexo Técnico vigente. Sin este archivo,
los títulos se clasifican, pero no se puntúan.

**Proceso de docentes 2026.** `verificador-titulos/parametros/parametros-va-docentes-2026.json`
trae las tablas de los numerales 5.1.1 a 5.1.5 del Anexo Técnico de los Procesos de Selección
Nos. 2917 a 3006 de 2026. Hay una tabla por empleo: rector, coordinador, director rural, docente
de aula y orientador. Las cifras salen del texto del anexo en el cerebro del Despacho. Para cada
aspirante, el verificador proyecta tres factores, cada uno con su tope:

1. **Requisito mínimo:** 5 puntos, si el dictamen es «Cumple».
2. **Educación adicional afín al cargo:** licenciaturas y posgrados en educación o pedagogía.
   En el orientador cuentan también psicología y trabajo social.
3. **Educación adicional en otras áreas:** los demás pregrados y posgrados.

Si el verificador no ve una afinidad probable, proyecta el título en el factor 3 y el motivo
dice cuántos puntos tendría en el factor 2 si el analista establece que es afín. Los normalistas,
técnicos y tecnólogos adicionales no puntúan, porque las tablas no los incluyen. Saber Pro,
segunda lengua, formación continua (cursos) y experiencia no los calcula el verificador.

El formato anterior, con `categorias` y `topeFactor` (ver la plantilla), sigue funcionando para
otros procesos. La plantilla viene sin cifras a propósito: la herramienta no trae puntajes
propios.

## Reglas que aplica

- **Ubicación en el SNIES.** Si el aspirante declara un código SNIES, se comprueba que
  corresponda a la institución y a la denominación declaradas. Un código que no corresponde
  genera una alerta, y entonces el programa se busca por institución y denominación. Si dos
  programas son plausibles y llevan a resultados distintos, el caso va a revisión humana.
- **Un posgrado no suple el pregrado exigido**, porque no permite establecer si el pregrado
  corresponde a lo que pide el manual.
- **Fecha de corte.** No se tiene en cuenta el título obtenido después del último día de
  inscripciones. Si falta la fecha de grado, el caso va a revisión.
- **Títulos del exterior.** Se aplica el Criterio Unificado de la CNSC del 4 de junio de 2024.
  En la VRM, el título de educación superior apostillado o legalizado, y traducido cuando
  aplica, no exige convalidación. En la VA solo se puntúa si está convalidado. Estos títulos
  van siempre a revisión, porque el SNIES no los registra.
- **Programa inactivo** en el SNIES: genera una alerta informativa, no un rechazo.
- **Valoración de Antecedentes.** El título que acreditó el requisito mínimo se valora en su
  propia categoría (numeral 2 del artículo 2.4.1.1.13 del Decreto 1075 de 2015) y no vuelve a
  contarse como educación adicional. La relación de los demás títulos con el empleo se marca
  como *probable* o *por establecer*, y siempre la confirma el analista.

Antes de usar la herramienta en un proceso concreto, verifique contra el Acuerdo y el Anexo
Técnico vigentes el texto del manual, la fecha de cierre y la tabla de VA.

## Lo que no hace

- No verifica la experiencia exigida a los directivos docentes ni la autenticidad de los
  documentos.
- No consulta el SNIES en línea: trabaja con el archivo que se le carga. Conviene descargarlo
  de nuevo para cada proceso.
- No sustituye la lectura del folio cuando el resultado es *Revisión humana*.

## Construcción y pruebas

- `npm run construir:verificador` genera `verificador-titulos.html`. Se versiona, como el
  asistente: hay que regenerarlo antes de cada commit que cambie `verificador-titulos/`.
- `npm run prueba:verificador` lo construye y ejecuta `pruebas/verificador_titulos.mjs`: el
  núcleo, el flujo en la página, axe (claro, oscuro y texto al 200 %) y reflujo a 320 px.
- No usa dependencias nuevas: esbuild (ya instalado) compila el TypeScript, y el `.xlsx` se abre
  con `DecompressionStream`, que traen el navegador y Node.

## Código

| Archivo | Función |
|---|---|
| `nucleo/texto.ts` | Normalización de denominaciones y medidas de parecido |
| `nucleo/zip.ts` | Lector ZIP mínimo para los `.xlsx` |
| `nucleo/tabla.ts` | Lectura de CSV y XLSX |
| `nucleo/snies.ts` | Catálogo SNIES y resolución de un título |
| `nucleo/manual.ts` | Reglas del manual de funciones |
| `nucleo/motor.ts` | Dictamen del requisito de formación |
| `nucleo/va.ts` | Clasificación y puntaje de VA |
| `nucleo/lote.ts` | Carga de aspirantes, lote e informe CSV |
| `cli.ts` | Ejecución desde la terminal (`herramientas/verificar_titulos.mjs` la empaqueta) |
| `ui/plantilla.html`, `ui/estilos.css`, `ui/app.ts` | Página (`herramientas/construir_verificador.mjs` la empaqueta) |

Los datos de prueba (`pruebas/verificador/`) son ficticios: no reproducen el SNIES real ni la
Resolución 003842. La última sección de `nucleo.prueba.ts` carga además el manual transcrito y
lo coteja con un SNIES de ensayo, también inventado.
