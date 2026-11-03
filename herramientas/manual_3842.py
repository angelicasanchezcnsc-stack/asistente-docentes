"""Convierte la transcripción de la Resolución MEN 003842 de 2022 en la tabla del manual.

Entradas (en verificador-titulos/fuentes/):
  res-3842-2022-requisitos.txt  transcripción literal de los requisitos de formación académica
  res-3842-2022-desglose.csv    reglas de los ítems que no se pueden llevar a una sola regla
  res-3842-2022-validados.txt   empleos cuya transcripción ya validó una persona (uno por línea)

Salida:
  verificador-titulos/manual/manual-funciones-3842-2022.csv  (la carga el verificador)

Reglas de conversión de cada ítem de la transcripción:
  1. Si el ítem está en el desglose, se usan esas reglas.
  2. Si termina con un paréntesis de ampliación («solo, con otra opción o con énfasis» y sus
     variantes), se vuelve una regla CONTIENE con el texto anterior al paréntesis.
  3. «Normalista superior» se vuelve una regla NORMALISTA.
  4. Lo demás se vuelve una regla EXACTA con el texto literal.
  Un ítem con «o», «y/o», dos puntos, punto y coma, coma, paréntesis, «afines» o «cualquier»
  que no esté en el desglose detiene el proceso: necesita una lectura humana.

Las reglas salen en estado «revisar»: el verificador manda a revisión humana todo resultado
que dependa de ellas. Cuando una persona valida contra el PDF la transcripción y el desglose de
un empleo, agrega su empleo_id a res-3842-2022-validados.txt y, al volver a correr el script,
las reglas de ese empleo salen en estado «vigente».

Uso: python herramientas/manual_3842.py
"""
from __future__ import annotations

import csv
import re
import sys
import unicodedata
from collections import Counter, OrderedDict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / 'verificador-titulos' / 'fuentes'
TRANSCRIPCION = FUENTES / 'res-3842-2022-requisitos.txt'
DESGLOSE = FUENTES / 'res-3842-2022-desglose.csv'
VALIDADOS = FUENTES / 'res-3842-2022-validados.txt'
SALIDA = RAIZ / 'verificador-titulos' / 'manual' / 'manual-funciones-3842-2022.csv'

NORMA = 'Resolución MEN 003842 de 2022'
LISTAS = {'F': 'formación académica', 'L': 'licenciaturas', 'P': 'títulos profesionales'}
MODOS = {'EXACTA', 'CONTIENE', 'TERMINOS', 'NBC', 'CAMPO', 'NIVEL', 'NORMALISTA', 'EXCLUYE'}

NOTA_SIN_OTRA_OPCION = 'El manual la admite sola o con énfasis; no menciona «otra opción».'
# Paréntesis de ampliación, normalizados (sin tildes, minúsculas, espacios simples).
AMPLIACIONES = {
    'solo, con otra opcion o con enfasis': '',
    'solo o con otra opcion o con enfasis': '',
    'solo o con otra opcion, con enfasis': '',
    'solo, con otra opcion o enfasis': '',
    'solo, con otra opcion o con otro enfasis': '',
    'solo o con otra opcion o con algun enfasis': '',
    'solo o con otra opcion': '',
    'sola o con otra opcion': '',
    'solo o con enfasis': NOTA_SIN_OTRA_OPCION,
    'sola o con enfasis': NOTA_SIN_OTRA_OPCION,
}
REQUIERE_DESGLOSE = re.compile(r'[:;,()]|\by/o\b|\bo\b|\bafines\b|\bcualquier', re.IGNORECASE)


def sin_tildes(texto: str) -> str:
    t = unicodedata.normalize('NFD', texto)
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn')


def normal(texto: str) -> str:
    return re.sub(r'\s+', ' ', sin_tildes(texto).lower()).strip()


def limpiar_final(texto: str) -> str:
    """Quita el punto, el guion o los espacios sobrantes al final del ítem."""
    return re.sub(r'[\s.\-]+$', '', texto.strip())


def leer_transcripcion() -> list[dict]:
    secciones: list[dict] = []
    actual = None
    for n, linea in enumerate(TRANSCRIPCION.read_text(encoding='utf-8').splitlines(), 1):
        linea = linea.strip()
        if not linea or linea.startswith('#'):
            continue
        if linea.startswith('@'):
            partes = [p.strip() for p in linea[1:].split('|')]
            if len(partes) != 4:
                sys.exit(f'Línea {n}: el encabezado de numeral debe tener 4 campos.')
            actual = {'numeral': partes[0], 'empleo_id': partes[1], 'empleo': partes[2],
                      'area': partes[3], 'items': []}
            secciones.append(actual)
            continue
        if actual is None:
            sys.exit(f'Línea {n}: ítem antes del primer numeral.')
        partes = [p.strip() for p in linea.split('|', 3)]
        if len(partes) != 4 or partes[1] not in ('E', 'F', 'L', 'P'):
            sys.exit(f'Línea {n}: formato «hoja | lista | número | texto» no reconocido.')
        hoja, lista, numero, texto = partes
        if lista == 'E':
            continue
        actual['items'].append({'hoja': hoja, 'lista': lista, 'numero': numero, 'texto': texto,
                                'clave': f"{actual['numeral']}|{hoja}|{lista}|{numero}"})
    return secciones


def leer_desglose() -> OrderedDict[str, list[dict]]:
    desglose: OrderedDict[str, list[dict]] = OrderedDict()
    with DESGLOSE.open(encoding='utf-8-sig', newline='') as f:
        for n, fila in enumerate(csv.DictReader(f, delimiter=';'), 2):
            modo = (fila['modo'] or '').strip().upper()
            if modo not in MODOS:
                sys.exit(f'Desglose, fila {n}: modo «{fila["modo"]}» no reconocido.')
            desglose.setdefault(fila['clave'].strip(), []).append({
                'modo': modo,
                'valor': (fila['valor'] or '').strip(),
                'niveles': (fila['niveles'] or '').strip() or 'universitaria',
                'nota': (fila['nota'] or '').strip(),
            })
    return desglose


def reglas_automaticas(item: dict) -> list[dict]:
    texto = limpiar_final(item['texto'])
    if normal(texto).startswith('normalista superior'):
        return [{'modo': 'NORMALISTA', 'valor': texto, 'niveles': '', 'nota': ''}]
    m = re.match(r'^(.*?)\s*\(([^()]*)\)$', texto)
    if m and normal(m.group(2)) in AMPLIACIONES:
        base = limpiar_final(m.group(1))
        modo, nota = 'CONTIENE', AMPLIACIONES[normal(m.group(2))]
    else:
        base, modo, nota = texto, 'EXACTA', ''
    if REQUIERE_DESGLOSE.search(base) or item['lista'] == 'F':
        raise ValueError(base)
    return [{'modo': modo, 'valor': base, 'niveles': 'universitaria', 'nota': nota}]


def leer_validados(empleos: set[str]) -> set[str]:
    if not VALIDADOS.exists():
        return set()
    validados = set()
    for n, linea in enumerate(VALIDADOS.read_text(encoding='utf-8').splitlines(), 1):
        linea = linea.split('#', 1)[0].strip()
        if not linea:
            continue
        if linea not in empleos:
            sys.exit(f'{VALIDADOS.name}, línea {n}: «{linea}» no es un empleo_id de la transcripción.')
        validados.add(linea)
    return validados


def main() -> None:
    secciones = leer_transcripcion()
    desglose = leer_desglose()
    validados = leer_validados({s['empleo_id'] for s in secciones})
    usadas: set[str] = set()
    pendientes: list[str] = []
    filas: list[list[str]] = []
    por_modo: Counter[str] = Counter()
    claves_vistas: set[str] = set()

    for s in secciones:
        for it in s['items']:
            if it['clave'] in claves_vistas:
                sys.exit(f'Clave repetida en la transcripción: {it["clave"]}')
            claves_vistas.add(it['clave'])
            if it['clave'] in desglose:
                reglas = desglose[it['clave']]
                usadas.add(it['clave'])
            else:
                try:
                    reglas = reglas_automaticas(it)
                except ValueError:
                    pendientes.append(f'{it["clave"]}  {it["texto"]}')
                    continue
            fuente = (f'{NORMA}, numeral {s["numeral"]}, {LISTAS[it["lista"]]}, '
                      f'ítem {it["numero"]} (hoja {it["hoja"]})')
            literal = limpiar_final(it['texto'])
            for r in reglas:
                notas = []
                if r['modo'] in ('NBC', 'NIVEL', 'NORMALISTA') or normal(r['valor']) != normal(literal):
                    notas.append(f'Texto del manual: «{it["texto"]}»')
                if r['nota']:
                    notas.append(r['nota'])
                nota = ' '.join(x if x.endswith('.') else f'{x}.' for x in notas)
                filas.append([s['empleo_id'], s['empleo'], s['area'], r['modo'], r['valor'],
                              r['niveles'], '',
                              'vigente' if s['empleo_id'] in validados else 'revisar', fuente, nota])
                por_modo[r['modo']] += 1

    sobrantes = [c for c in desglose if c not in usadas]
    if pendientes or sobrantes:
        if pendientes:
            print('Ítems que necesitan desglose (agréguelos a res-3842-2022-desglose.csv):')
            print('\n'.join(f'  {p}' for p in pendientes))
        if sobrantes:
            print('Claves del desglose que no corresponden a ningún ítem de la transcripción:')
            print('\n'.join(f'  {c}' for c in sobrantes))
        sys.exit(1)

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with SALIDA.open('w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\r\n')
        w.writerow(['empleo_id', 'empleo', 'area', 'modo', 'valor', 'niveles', 'excluye',
                    'estado', 'fuente', 'nota'])
        w.writerows(filas)

    items = sum(len(s['items']) for s in secciones)
    print(f'{len(secciones)} empleos, {items} ítems de la transcripción, {len(filas)} reglas '
          f'({len(usadas)} ítems desglosados).')
    print('Reglas por modo: ' + ', '.join(f'{m} {n}' for m, n in sorted(por_modo.items())))
    print(f'Empleos validados (reglas en «vigente»): {len(validados)} de {len(secciones)}.')
    print(f'Escrito: {SALIDA.relative_to(RAIZ)}')


if __name__ == '__main__':
    main()
