"""Genera herramientas/opec.json a partir del reporte de la OPEC (fase 9).

Uso:
    python herramientas/opec.py "C:\\01_APLICACIONES\\CHATBOT\\rp docentes 07.10.2026.xlsx" --corte 2026-10-07

Lee solo la hoja «Base de datos» y solo las columnas de COLUMNAS. Las demás hojas del reporte son de control
interno y no se leen. El texto se conserva literal: solo se quitan los espacios al principio y al final
(y la alternativa de estudio y experiencia se parte por «---»).
"""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

try:
    import openpyxl
except ImportError:
    sys.exit('ERROR: falta openpyxl. Instálelo con: python -m pip install openpyxl')

AQUI = Path(__file__).resolve().parent
KB = AQUI / 'kb.json'
SALIDA = AQUI / 'opec.json'

COLUMNAS = ['origen_modelo', 'nombre_entidad', 'opec', 'convocatoria_padre_nombre', 'tipo_proceso', 'denominacion',
            'nivel', 'estado', 'discapacidad_descripcion', 'discapacidad_cargo_flag', 'requisito_estudio',
            'requisito_experiencia', 'alt_estudio_experiencia', 'funciones']
PROCESO = 'DOCENTES Y DIRECTIVOS DOCENTES 2026'
MODALIDAD = {'Concurso Abierto': 'sin-reserva', 'Concurso Abierto Discapacidad': 'reserva'}

# Palabras de la forma administrativa que no distinguen una entidad de otra (se comparan sin tildes).
FORMA = ['SECRETARIA DE EDUCACION', 'Y CULTURA', 'DEPARTAMENTAL', 'DEPARTAMENTO', 'MUNICIPAL', 'MUNICIPIO',
         'DISTRITAL', 'DISTRITO', 'ESPECIAL', 'TURISTICO', 'CULTURAL', 'HISTORICO', 'PORTUARIO', 'INDUSTRIAL',
         'BIODIVERSO', 'ECOTURISTICO', 'DOCENTES', 'D C', 'DE', 'DEL', 'Y']
# Nombre normalizado de la OPEC → nombre normalizado del acuerdo, cuando la normalización no basta.
ALIAS = {
    'LORICA': 'SANTA CRUZ LORICA',
    'CARTAGENA': 'CARTAGENA INDIAS',
    'CUCUTA': 'SAN JOSE CUCUTA',
    'LA ESTRELLA ANTIOQUIA': 'LA ESTRELLA',
}


def error(mensaje):
    sys.exit('ERROR: ' + mensaje)


def normalizar(nombre):
    s = unicodedata.normalize('NFD', str(nombre)).encode('ascii', 'ignore').decode().upper()
    s = ' ' + ' '.join(re.sub(r'[^A-Z ]', ' ', s).split()) + ' '
    for palabra in sorted(FORMA, key=len, reverse=True):
        s = s.replace(' ' + palabra + ' ', ' ')
        s = s.replace(' ' + palabra + ' ', ' ')  # palabras seguidas («DE DE»)
    return ' '.join(s.split())


def texto(valor):
    return '' if valor is None else str(valor).strip()


def es_verdadero(valor):
    return valor is True or str(valor).strip().lower() in ('true', 'verdadero', '1')


def main():
    sys.stdout.reconfigure(encoding='utf-8')  # la consola de Windows no es UTF-8 por defecto
    ap = argparse.ArgumentParser(description='Genera herramientas/opec.json desde el reporte de la OPEC.')
    ap.add_argument('archivo', help='ruta del reporte .xlsx')
    ap.add_argument('--corte', required=True, help='fecha de corte del reporte, AAAA-MM-DD')
    args = ap.parse_args()
    try:
        date.fromisoformat(args.corte)
    except ValueError:
        error(f'--corte debe ser una fecha AAAA-MM-DD (llegó «{args.corte}»)')
    ruta = Path(args.archivo)
    if not ruta.is_file():
        error(f'no existe el archivo «{ruta}»')

    libro = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    hoja = next((h for h in libro.worksheets if h.title.strip().lower() == 'base de datos'), None)
    if hoja is None:
        error(f'el reporte no tiene la hoja «Base de datos» (hojas: {", ".join(h.title for h in libro.worksheets)})')
    filas = hoja.iter_rows(values_only=True)
    encabezado = [texto(c) for c in next(filas)]
    faltan = [c for c in COLUMNAS if c not in encabezado]
    if faltan:
        error('a la hoja «Base de datos» le faltan las columnas: ' + ', '.join(faltan))
    pos = {c: encabezado.index(c) for c in COLUMNAS}

    # Acuerdos de kb.json: el nombre de cada uno es la clave de su entidad en opec.json.
    acuerdos = [d['entity'] for d in json.loads(KB.read_text(encoding='utf-8'))['docs'] if d['kind'] == 'acuerdo']
    por_norma = {}
    for e in acuerdos:
        n = normalizar(e)
        if n in por_norma:
            error(f'dos acuerdos de kb.json se normalizan igual: «{por_norma[n]}» y «{e}»')
        por_norma[n] = e

    textos, indice = [], {}
    def guardar(t):
        if t not in indice:
            indice[t] = len(textos)
            textos.append(t)
        return indice[t]

    excluidas = Counter()
    nombre_opec = {}          # entidad del acuerdo → nombre en la OPEC
    alias_usados = {}
    empleos = defaultdict(dict)  # entidad → denominación → empleo
    total = 0
    for fila in filas:
        v = {c: fila[pos[c]] for c in COLUMNAS}
        if all(x is None for x in v.values()):
            continue
        ent_opec = texto(v['nombre_entidad'])
        if texto(v['origen_modelo']) != 'CONVOCATORIA' or str(v['estado']).strip() not in ('1', '1.0') \
                or PROCESO not in texto(v['convocatoria_padre_nombre']):
            excluidas[ent_opec] += 1
            continue
        tipo = texto(v['tipo_proceso'])
        if tipo not in MODALIDAD:
            error(f'tipo_proceso desconocido «{tipo}» en {ent_opec}, OPEC {texto(v["opec"])}')
        modalidad = MODALIDAD[tipo]
        disc = texto(v['discapacidad_descripcion'])
        if es_verdadero(v['discapacidad_cargo_flag']) != (modalidad == 'reserva'):
            error(f'discapacidad_cargo_flag no corresponde a la modalidad en {ent_opec}, OPEC {texto(v["opec"])}')
        if modalidad == 'reserva' and not disc:
            error(f'vacante con reserva sin discapacidad_descripcion en {ent_opec}, OPEC {texto(v["opec"])}')

        n = normalizar(ent_opec)
        if n in ALIAS:
            alias_usados[ent_opec] = ALIAS[n]
            n = ALIAS[n]
        if n not in por_norma:
            error(f'la entidad «{ent_opec}» (normalizada «{n}») no se empareja con ningún acuerdo de kb.json; agregue un alias')
        entidad = por_norma[n]
        if nombre_opec.setdefault(entidad, ent_opec) != ent_opec:
            error(f'dos entidades de la OPEC se emparejan con «{entidad}»: «{nombre_opec[entidad]}» y «{ent_opec}»')

        den = texto(v['denominacion'])
        requisitos = {
            'estudio': guardar(texto(v['requisito_estudio'])),
            'experiencia': guardar(texto(v['requisito_experiencia'])),
            'alternativas': [guardar(p.strip()) for p in texto(v['alt_estudio_experiencia']).split('---') if p.strip()],
            'funciones': guardar(texto(v['funciones'])),
        }
        emp = empleos[entidad].get(den)
        if emp is None:
            emp = empleos[entidad][den] = {'denominacion': den, 'nivel': texto(v['nivel']), **requisitos, 'opec': {}}
        elif any(emp[k] != requisitos[k] for k in requisitos):
            error(f'{ent_opec}, {den}: hay más de un juego de requisitos o funciones')
        numero = texto(v['opec'])
        o = emp['opec'].get(numero)
        if o is None:
            o = emp['opec'][numero] = {'numero': numero, 'modalidad': modalidad, 'vacantes': 0,
                                       'discapacidad': guardar(disc) if disc else None}
        elif o['modalidad'] != modalidad or o['discapacidad'] != (indice[disc] if disc else None):
            error(f'{ent_opec}, OPEC {numero}: sus vacantes tienen distinta modalidad o discapacidad')
        o['vacantes'] += 1
        total += 1

    sin_opec = [e for e in acuerdos if e not in empleos]
    if sin_opec:
        error('acuerdos de kb.json sin OPEC: ' + '; '.join(sin_opec))

    clave_es = lambda s: unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode().lower()
    salida_ent = {}
    numeros = set()
    sumas = Counter()
    for entidad in acuerdos:
        lista = sorted(empleos[entidad].values(),
                       key=lambda x: (x['nivel'] != 'Directivo Docente', clave_es(x['denominacion']), x['denominacion']))
        for emp in lista:
            emp['opec'] = sorted(emp['opec'].values(), key=lambda o: (o['modalidad'] != 'sin-reserva', o['numero']))
            for o in emp['opec']:
                numeros.add(o['numero'])
                sumas[o['modalidad']] += o['vacantes']
        salida_ent[entidad] = {'nombreOpec': nombre_opec[entidad], 'empleos': lista}
    if sumas['sin-reserva'] + sumas['reserva'] != total:
        error('la suma de vacantes por OPEC no coincide con el número de filas')

    resultado = {
        'corte': args.corte,
        'archivo': ruta.name,
        'sha256': hashlib.sha256(ruta.read_bytes()).hexdigest(),
        'totales': {'vacantes': total, 'sinReserva': sumas['sin-reserva'], 'reserva': sumas['reserva'],
                    'entidades': len(salida_ent), 'opec': len(numeros), 'excluidas': sum(excluidas.values())},
        'textos': textos,
        'entidades': salida_ent,
    }
    SALIDA.write_text(json.dumps(resultado, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    t = resultado['totales']
    print(f'OPEC: {ruta.name} (corte {args.corte}), hoja «{hoja.title}»')
    print(f'  Vacantes: {t["vacantes"]:,} ({t["sinReserva"]:,} sin reserva y {t["reserva"]:,} con reserva)'.replace(',', '.'))
    print(f'  Entidades: {t["entidades"]}; números de OPEC: {t["opec"]:,}; textos distintos: {len(textos)}'.replace(',', '.'))
    print(f'  Vacantes excluidas: {t["excluidas"]}')
    for e, c in sorted(excluidas.items()):
        print(f'    ADVERTENCIA: {e}: {c} excluidas (no son de la convocatoria del proceso o no están activas)')
    print('  Alias usados:')
    for o, a in sorted(alias_usados.items()):
        print(f'    {o} → {a}')
    print(f'  Generado: {SALIDA} ({SALIDA.stat().st_size / 1e3:.0f} kB)')


if __name__ == '__main__':
    main()
