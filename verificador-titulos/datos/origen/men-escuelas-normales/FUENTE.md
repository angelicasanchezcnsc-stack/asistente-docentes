# Escuelas Normales Superiores: listados del MEN

- **Página de origen:** Ministerio de Educación Nacional, «Escuelas Normales Superiores en Colombia» (portal Adelante Maestros), actualizada el 16 de junio de 2026: <https://www.mineducacion.gov.co/portal/adelante-maestros/Formacion/345504:Escuelas-Normales-Superiores-en-Colombia>
- **Fecha de descarga:** 3 de noviembre de 2026.

| Archivo | Contenido según la página | Bytes | Última modificación del archivo en el servidor | SHA-256 |
|---|---|---|---|---|
| `articles-345504_anexo_2_listado_ENS.pdf` | Programas de formación complementaria presencial con autorización de funcionamiento por cinco años | 133.248 | 19/09/2014 | `498e71a9d2509ffa0cf0c3c90e6ec7c0a61d68305eb60b839ae52f747a772bf3` |
| `articles-345504_anexo_3.pdf` | Programas de formación complementaria a distancia con autorización de funcionamiento | 60.438 | 19/09/2014 | `9c8ad9f7b8cc118ec1f463eef44418c9ab1d52c4977695d96691bea4218f71b8` |
| `articles-345504_anexo_4.pdf` | Directorio de las 137 Escuelas Normales Superiores | 181.422 | 19/09/2014 | `2c6ca4f1e6b117ff93c51766139cd86cc210ecfb2d076aa76744cc13c4672a77` |

## Tabla sin datos personales

`escuelas-normales-superiores-2014.csv` (separador `;`, UTF-8; SHA-256 `fb3006ba71c3e543b3c3bf5853a1090f6046082adce604bbcf9efb8b40ee0cdb`) reúne las 137 Escuelas Normales con estas columnas: `n`, `departamento`, `secretaria`, `municipio`, `institucion`, `codigo_dane`, `sector`, `zona` y `programa_a_distancia`.

- Sale de `anexo_2` (nombre, código DANE, sector y zona) y de `anexo_3` (marca «sí» en las 3 escuelas con programa a distancia).
- Se cotejó con el directorio (`anexo_4`): las 137 instituciones coinciden por nombre. Del directorio no se tomó ningún dato: ni rector, ni teléfonos, ni correos, ni dirección.
- Los textos se conservan como los publicó el MEN, con sus erratas (por ejemplo, «Aberrojal» por Abejorral y «San Juan del Cesár»).
- Sectores: 129 oficiales y 8 privadas.

## Advertencias

- Los archivos son de 2014. Sirven como referencia, no como prueba vigente.
- Hablan de **autorización de funcionamiento** del programa de formación complementaria (Decreto 4790 de 2008 y Resolución 505 de 2010), no de la acreditación que menciona el Anexo Técnico 2026 (numeral 4.1.1: Escuelas Normales «transformadas y acreditadas»).
- **`articles-345504_anexo_4.pdf` se sacó del proyecto el 3 de noviembre de 2026** porque contiene datos personales (nombre del rector, teléfonos y correos de 2014), que la regla 5 de `CLAUDE.md` no permite guardar. Se dejan su fuente y su huella en la tabla para trazabilidad. Los otros dos archivos solo traen datos institucionales (departamento, municipio, nombre de la escuela, código DANE, sector y zona).
- El listado vigente debe pedirse al MEN (Dirección de Calidad para la Educación Preescolar, Básica y Media).
