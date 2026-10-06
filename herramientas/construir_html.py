"""Genera asistente-docentes.html a partir de plantilla.html, kb.json y faq.json (misma carpeta o rutas dadas)."""
import json, sys, os
here = os.path.dirname(os.path.abspath(__file__))
plantilla = os.path.join(here, 'plantilla.html')
kb = os.path.join(here, 'kb.json')
faq = os.path.join(here, 'faq.json')
salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(here), 'asistente-docentes.html')
def js(p):
    return json.dumps(json.load(open(p, encoding='utf-8')), ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
html = open(plantilla, encoding='utf-8').read()
html = html.replace('/*__KB__*/null', js(kb)).replace('/*__FAQ__*/null', js(faq))
open(salida, 'w', encoding='utf-8').write(html)
print('Generado:', salida, round(len(html.encode('utf-8'))/1e6, 2), 'MB')
