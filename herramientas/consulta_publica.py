"""Preguntas de la consulta pública (fase 10): candidatas, banco y sinónimos.

Uso:
    python herramientas/consulta_publica.py extraer "C:\\01_APLICACIONES\\CHATBOT\\matriz-de-observaciones-respuestas-ciudadania (1).xlsx"

Privacidad (PLAN_IMPLEMENTACION.md, fase 10):
- Todo texto derivado de la matriz se escribe SOLO en la carpeta privada, fuera del proyecto
  (por defecto C:\\01_APLICACIONES\\CHATBOT\\PRIVADO_CONSULTA_PUBLICA). Nunca dentro del proyecto.
- De la matriz se leen solo las columnas «Artículo Acuerdo» y «Observación recibida».
- La consola muestra solo conteos, nunca texto de la ciudadanía.
"""
import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('ERROR: falta openpyxl. Instálelo con: python -m pip install openpyxl')

AQUI = Path(__file__).resolve().parent
PROYECTO = AQUI.parent
PRIVADO_PREDETERMINADO = PROYECTO.parent / 'PRIVADO_CONSULTA_PUBLICA'
KB = AQUI / 'kb.json'
HOJA = 'publicidad e informe'
COL_ARTICULO = 'Artículo Acuerdo'
COL_OBSERVACION = 'Observación recibida'


def error(mensaje):
    sys.exit('ERROR: ' + mensaje)


def sin_tildes(s):
    """Minúsculas y sin tildes (la ñ se conserva como n, igual que en la comparación del motor)."""
    return unicodedata.normalize('NFD', str(s)).encode('ascii', 'ignore').decode().lower()


# ---------- Filtros de privacidad (10.1, paso 3). Se comparan sin tildes y sin distinguir mayúsculas. ----------
CONTACTO = re.compile(r'@|http|www\.|\d{5,}|(?<![a-z])c\.c\.|\bcc\b|\bcedula\b|\bnit\b|\btelefono\b|\bcelular\b|\bcel\.')
PRIMERA = re.compile(r'\b(yo|mi|mis|me|mio|mia|conmigo|tengo|soy|estoy|he|hice|trabajo|laboro|vivo|naci|nuestro|nuestra|'
                     r'nuestros|nuestras|nos|somos|estamos|tenemos|'
                     # verbos en primera persona del singular (refuerzo del 8 de octubre de 2026)
                     r'hago|deseo|quisiera|quiero|considero|solicito|pregunto|necesito|aspiro|inscribi|presente|'
                     r'pague|obtuve|cuento|ejerzo|curse|termine|estudie|resido)\b')
SENSIBLES = re.compile(r'diagnostic|enfermedad|cancer|embaraz|victima|amenaz|denuncia|sindica|religi|orientacion sexual|'
                       r'hijo|hija|esposo|esposa|madre cabeza|tutela')
INTERROGATIVA = re.compile(r'^(¿|que\b|como\b|cual\b|cuales\b|cuando\b|cuant[oa]s?\b|donde\b|quien|por que\b|se puede\b|'
                           r'puede\b|pueden\b|es posible\b|existe\b)')
PALABRA = re.compile(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+')


def vocabulario_kb():
    textos = json.loads(KB.read_text(encoding='utf-8'))['texts']
    return set(re.findall(r'[a-z]+', sin_tildes(' '.join(textos))))


def motivo_descarte(oracion, vocab):
    """Devuelve el motivo por el que la oración no puede guardarse, o None si pasa todos los filtros."""
    n = sin_tildes(oracion)
    if CONTACTO.search(n):
        return 'contacto o identificación'
    if PRIMERA.search(n):
        return 'primera persona'
    if SENSIBLES.search(n):
        return 'datos sensibles'
    palabras = PALABRA.findall(oracion)
    for p in palabras[1:]:  # la primera palabra de la oración puede ir en mayúscula
        if p[0].isupper() and sin_tildes(p) not in vocab:
            return 'nombre propio fuera de los documentos'
    return None


def es_interrogativa(oracion):
    return '?' in oracion or bool(INTERROGATIVA.match(sin_tildes(oracion)))


def carpeta_privada(ruta):
    privado = Path(ruta).resolve() if ruta else PRIVADO_PREDETERMINADO.resolve()
    if privado == PROYECTO or PROYECTO in privado.parents:
        error('la carpeta privada no puede estar dentro de la carpeta del proyecto')
    privado.mkdir(parents=True, exist_ok=True)
    return privado


def leer_matriz(ruta):
    """Lee solo las dos columnas permitidas; devuelve [(artículo, observación)]."""
    libro = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    hoja = next((h for h in libro.worksheets if h.title.strip().lower() == HOJA), None)
    if hoja is None:
        error('la matriz no tiene la hoja «Publicidad e Informe»')
    pos = None
    filas = []
    for fila in hoja.iter_rows(values_only=True):
        if pos is None:
            celdas = [str(c).strip() if c is not None else '' for c in fila]
            if COL_ARTICULO in celdas and COL_OBSERVACION in celdas:
                pos = (celdas.index(COL_ARTICULO), celdas.index(COL_OBSERVACION))
            continue
        art, obs = fila[pos[0]], fila[pos[1]]
        if obs:
            filas.append((str(art or '').strip(), str(obs)))
    if pos is None:
        error(f'no se encontraron las columnas «{COL_ARTICULO}» y «{COL_OBSERVACION}»')
    return filas


def extraer(args):
    privado = carpeta_privada(args.privado)
    salida = privado / 'candidatas.csv'
    if salida.exists() and not args.sobrescribir:
        error(f'ya existe {salida} (puede tener la revisión hecha). Use --sobrescribir solo si quiere empezar de nuevo.')
    vocab = vocabulario_kb()
    observaciones = leer_matriz(args.matriz)
    cuenta = Counter()
    vistas = set()
    candidatas = []
    for articulo, obs in observaciones:
        for oracion in re.split(r'(?<=[?.!])\s+|\n+', obs):
            oracion = oracion.strip()
            if not (15 <= len(oracion) <= 250) or not es_interrogativa(oracion):
                continue
            cuenta['interrogativas'] += 1
            motivo = motivo_descarte(oracion, vocab)
            if motivo:
                cuenta['descartadas: ' + motivo] += 1
                continue
            clave = ' '.join(re.findall(r'[a-z0-9]+', sin_tildes(oracion)))
            if clave in vistas:
                cuenta['repetidas'] += 1
                continue
            vistas.add(clave)
            candidatas.append((articulo, oracion))
    with salida.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['id', 'articulo_observado', 'pregunta', 'decision'])
        for i, (articulo, oracion) in enumerate(candidatas, 1):
            w.writerow([f'c{i:04d}', articulo, oracion, ''])
    # Solo conteos en la consola.
    print(f'Observaciones leídas: {len(observaciones)}')
    print(f'Oraciones interrogativas: {cuenta["interrogativas"]}')
    for k in sorted(k for k in cuenta if k.startswith('descartadas')):
        print(f'  {k}: {cuenta[k]}')
    print(f'  repetidas: {cuenta["repetidas"]}')
    print(f'Candidatas: {len(candidatas)}')
    print(f'Archivo para revisión (carpeta privada): {salida}')


# ---------- Motor de búsqueda: STOP, SYN y stem, leídos de src/js/motor-busqueda.js (una sola fuente). ----------
MOTOR = PROYECTO / 'src' / 'js' / 'motor-busqueda.js'


def leer_motor():
    js = MOTOR.read_text(encoding='utf-8')
    stop = set(re.search(r"STOP = new Set\(\('([^']*)'\)", js).group(1).split())
    syn = set(re.findall(r"(\w+):'", re.search(r'SYN = \{(.*?)\};', js, re.S).group(1)))
    return stop, syn


def stem(w):
    """La misma raíz del motor (motor-busqueda.js, función stem)."""
    if w.isdigit():
        return w
    if len(w) > 4 and w.endswith('es'):
        w = w[:-2]
    elif len(w) > 3 and w.endswith('s'):
        w = w[:-1]
    return w[:6] if len(w) > 6 else w


def raices_kb():
    textos = json.loads(KB.read_text(encoding='utf-8'))['texts']
    return {stem(w) for w in re.findall(r'[a-z0-9]+', sin_tildes(' '.join(textos)))}


def fuente_esperada(articulo):
    """Fuente que se espera en la respuesta, deducida del artículo o capítulo que la persona comentó."""
    m = re.match(r'Art[ií]culo (\d+)\b', articulo)
    if m:
        return f'Artículo {m.group(1)}'
    m = re.search(r'Cap[ií]tulo (\d+)\b', articulo)
    if m and articulo.startswith('Anexo'):
        return f'Numeral {m.group(1)}'
    if 'OPEC' in articulo:
        return 'Artículo 8'
    return None


def leer_candidatas(privado):
    ruta = privado / 'candidatas.csv'
    if not ruta.exists():
        error(f'no existe {ruta}; ejecute primero «extraer»')
    filas = list(csv.DictReader(ruta.open(encoding='utf-8-sig')))
    malas = [f['id'] for f in filas if f['decision'].strip().lower() not in ('si', 'sí', 'no')]
    if malas:
        error(f'{len(malas)} filas sin decisión válida (si/no), por ejemplo {", ".join(malas[:5])}')
    return filas


def leer_banco(privado):
    ruta = privado / 'banco.json'
    if not ruta.exists():
        error(f'no existe {ruta}; ejecute primero «banco»')
    return json.loads(ruta.read_text(encoding='utf-8'))


def banco(args):
    privado = carpeta_privada(args.privado)
    vocab = vocabulario_kb()
    filas = leer_candidatas(privado)
    aprobadas = [f for f in filas if f['decision'].strip().lower() in ('si', 'sí')]
    # Defensa en profundidad: los filtros se vuelven a aplicar a lo aprobado.
    no_pasan = [f['id'] for f in aprobadas if motivo_descarte(f['pregunta'], vocab)]
    if no_pasan:
        error('estas filas aprobadas no pasan los filtros de privacidad: ' + ', '.join(no_pasan))
    datos = [{'id': f['id'], 'pregunta': f['pregunta'], 'articulo_observado': f['articulo_observado'],
              'fuente_esperada': fuente_esperada(f['articulo_observado'])} for f in aprobadas]
    (privado / 'banco.json').write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')

    # Vocabulario: palabras de 5 o más preguntas aprobadas que el motor no conoce y que no están en los documentos.
    stop, syn = leer_motor()
    raices = raices_kb()
    frecuencia = Counter()
    for d in datos:
        frecuencia.update(set(re.findall(r'[a-z]+', sin_tildes(d['pregunta']))))
    palabras = sorted(((w, n) for w, n in frecuencia.items()
                       if n >= 5 and len(w) >= 4 and w not in stop and w not in syn and stem(w) not in raices),
                      key=lambda x: (-x[1], x[0]))
    with (privado / 'vocabulario.csv').open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['palabra', 'frecuencia', 'equivale_a'])
        for palabra, n in palabras:
            w.writerow([palabra, n, ''])
    print(f'Aprobadas: {len(aprobadas)}; rechazadas: {len(filas) - len(aprobadas)}')
    print(f'Con fuente esperada: {sum(1 for d in datos if d["fuente_esperada"])}')
    print(f'Palabras del vocabulario: {len(palabras)}')
    print(f'Archivos (carpeta privada): banco.json, vocabulario.csv')


def verificar(args):
    """Vuelve a aplicar los filtros al banco; solo informa cuántas preguntas no pasan (para la prueba de privacidad)."""
    privado = carpeta_privada(args.privado)
    vocab = vocabulario_kb()
    no_pasan = sum(1 for d in leer_banco(privado) if motivo_descarte(d['pregunta'], vocab))
    print(no_pasan)
    sys.exit(1 if no_pasan else 0)


def sinonimos(args):
    privado = carpeta_privada(args.privado)
    stop, syn = leer_motor()
    raices = raices_kb()
    salida = {}
    for f in csv.DictReader((privado / 'vocabulario.csv').open(encoding='utf-8-sig')):
        palabra, equivale = f['palabra'].strip(), ' '.join(f['equivale_a'].split())
        if not equivale:
            continue
        if not re.fullmatch(r'[a-zñ]+', palabra):
            error(f'«{palabra}»: solo letras minúsculas sin tildes')
        if palabra in syn or palabra in stop:
            error(f'«{palabra}» ya está en SYN o en STOP del motor')
        faltan = [t for t in equivale.split() if stem(sin_tildes(t)) not in raices]
        if faltan:
            error(f'«{palabra}»: estos términos no están en los documentos: {", ".join(faltan)}')
        salida[palabra] = sin_tildes(equivale)
    destino = AQUI / 'sinonimos_ciudadania.json'
    destino.write_text(json.dumps(salida, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8')
    print(f'Sinónimos aprobados: {len(salida)} → {destino.name}')


def informe(args):
    """Informe de temas frecuentes para la persona responsable (carpeta privada; lleva ejemplos de la ciudadanía)."""
    privado = carpeta_privada(args.privado)
    datos = leer_banco(privado)
    obs = Counter(a for a, _ in leer_matriz(args.matriz))
    faq = json.loads((AQUI / 'faq.json').read_text(encoding='utf-8'))['items']
    medicion = {}
    ruta_med = PROYECTO / 'pruebas' / 'resultados' / 'consulta_publica.json'
    if ruta_med.exists():
        medicion = (json.loads(ruta_med.read_text(encoding='utf-8')).get('medicion') or {}).get('porArticulo', {})

    def cubre(f, fuente):
        if not fuente:
            return False
        return any(re.match(re.escape(fuente) + r'(\b|,|\.|$)', x['rotulo']) and not re.match(re.escape(fuente) + r'\d', x['rotulo'])
                   for x in f['fuentes'])

    por_art = {}
    for d in datos:
        por_art.setdefault(d['articulo_observado'], []).append(d)
    lineas = ['# Temas frecuentes de la consulta pública', '',
              'Documento interno. Contiene preguntas de la ciudadanía revisadas y sin datos personales. No se publica ni se versiona.', '',
              '| Artículo o capítulo observado | Observaciones | Preguntas aprobadas | Pregunta frecuente que lo cita | Sin respuesta (%) | Con la fuente esperada (%) |',
              '| --- | --- | --- | --- | --- | --- |']
    detalle = []
    for art, n in obs.most_common():
        preguntas = por_art.get(art, [])
        fuente = fuente_esperada(art)
        faqs = [f['id'] for f in faq if cubre(f, fuente)]
        m = medicion.get(art, {})
        lineas.append(f'| {art} | {n} | {len(preguntas)} | {", ".join(faqs) or "ninguna"} | {m.get("noEncontrado", "—")} | {m.get("fuenteEsperada", "—")} |')
        if preguntas:
            detalle += [f'## {art}', ''] + [f'- {d["pregunta"]}' for d in preguntas[:5]] + ['']
    lineas += ['', '# Ejemplos por artículo (hasta 5 preguntas aprobadas)', ''] + detalle
    (privado / 'temas_frecuentes.md').write_text('\n'.join(lineas), encoding='utf-8')
    print(f'Informe (carpeta privada): temas_frecuentes.md ({len(obs)} artículos o capítulos)')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='Preguntas de la consulta pública (fase 10).')
    sub = ap.add_subparsers(dest='orden', required=True)
    e = sub.add_parser('extraer', help='genera candidatas.csv en la carpeta privada')
    e.add_argument('matriz', help='ruta de la matriz de observaciones (.xlsx)')
    e.add_argument('--privado', help='carpeta privada (fuera del proyecto)')
    e.add_argument('--sobrescribir', action='store_true', help='reemplaza un candidatas.csv existente')
    for orden, ayuda in (('banco', 'banco.json y vocabulario.csv desde las candidatas revisadas (10.3)'),
                         ('verificar', 'vuelve a aplicar los filtros al banco (prueba de privacidad)'),
                         ('sinonimos', 'herramientas/sinonimos_ciudadania.json desde vocabulario.csv (10.5)')):
        p = sub.add_parser(orden, help=ayuda)
        p.add_argument('--privado', help='carpeta privada (fuera del proyecto)')
    i = sub.add_parser('informe', help='temas_frecuentes.md en la carpeta privada (10.6)')
    i.add_argument('matriz', help='ruta de la matriz (solo se lee la columna «Artículo Acuerdo» para contar)')
    i.add_argument('--privado', help='carpeta privada (fuera del proyecto)')
    args = ap.parse_args()
    {'extraer': extraer, 'banco': banco, 'verificar': verificar, 'sinonimos': sinonimos, 'informe': informe}[args.orden](args)


if __name__ == '__main__':
    main()
