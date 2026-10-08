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


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    ap = argparse.ArgumentParser(description='Preguntas de la consulta pública (fase 10).')
    sub = ap.add_subparsers(dest='orden', required=True)
    e = sub.add_parser('extraer', help='genera candidatas.csv en la carpeta privada')
    e.add_argument('matriz', help='ruta de la matriz de observaciones (.xlsx)')
    e.add_argument('--privado', help='carpeta privada (fuera del proyecto)')
    e.add_argument('--sobrescribir', action='store_true', help='reemplaza un candidatas.csv existente')
    for orden in ('banco', 'sinonimos'):
        p = sub.add_parser(orden, help='pasos 10.3 y 10.5 (después de la revisión de la persona responsable)')
        p.add_argument('--privado', help='carpeta privada (fuera del proyecto)')
    args = ap.parse_args()
    if args.orden == 'extraer':
        extraer(args)
    else:
        error(f'«{args.orden}» se implementa después de la revisión de las candidatas (plan, pasos 10.3 y 10.5).')


if __name__ == '__main__':
    main()
