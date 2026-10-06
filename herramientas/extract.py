import re,html,glob,os,json,sys
from bs4 import BeautifulSoup
HERE=os.path.dirname(os.path.abspath(__file__))
# Carpeta CHATBOT: dos niveles arriba de herramientas/ (puede pasarse como argumento)
BASE=sys.argv[1] if len(sys.argv)>1 else os.path.dirname(os.path.dirname(HERE))
def clean(s): return re.sub(r'\s+',' ',s).strip()
def table_text(t):
    rows=[]
    for tr in t.find_all('tr'):
        cells=[clean(c.get_text(' ')) for c in tr.find_all(['th','td'])]
        if any(cells): rows.append(' | '.join(cells))
    return '\n'.join(rows)
def parse(path,kind):
    soup=BeautifulSoup(open(path,encoding='utf-8',errors='ignore').read(),'html.parser')
    main=soup.find(id='main-content') or soup.body
    for x in main.find_all(['script','style','nav','footer']): x.decompose()
    ix=main.find(id='lx-indice')
    if ix: ix.decompose()
    chunks=[];cur=None;art=None;chap=None
    def flush():
        if cur and clean(cur['text']): chunks.append(cur)
    for el in main.find_all(['h1','h2','h3','h4','h5','p','li','table']):
        if el.find_parent('table') and el.name!='table': continue
        if el.name in('p','li') and el.find_parent('li') and el.name=='p': continue
        name=el.name
        if name in('h1','h2','h3','h4','h5'):
            h=clean(el.get_text(' '))
            if not h or h.startswith('${'): continue
            flush()
            m=re.match(r'(ART[IÍ]CULO\s+\w+)\.?',h,re.I)
            if kind=='acuerdo':
                if re.match(r'CAP[IÍ]TULO',h,re.I): chap=h; cur=None; continue
                if m: art=m.group(1).title().replace('Artículo','Artículo'); label=art
                elif re.match(r'PAR[AÁ]GRAFO',h,re.I):
                    p=re.match(r'(PAR[AÁ]GRAFO\s*\w*)',h,re.I).group(1).rstrip('.').capitalize()
                    label=f'{art}, {p}' if art else p
                else: label=h[:60]
            else:
                mm=re.match(r'(\d+(\.\d+)*)\.?\s',h)
                label=('Numeral '+mm.group(1)) if mm else h[:60]
            cur={'label':label,'title':h,'text':h}
        else:
            if el.find_parent('table') and name!='table': continue
            t=table_text(el) if name=='table' else clean(el.get_text(' '))
            if not t: continue
            if cur is None: cur={'label':'Encabezado','title':'Encabezado','text':''}
            cur['text']+=('\n' if cur['text'] else '')+t
    flush()
    return chunks
out=[]
anexo=os.path.join(BASE,'Proyecto Anexo Tecnico Docentes 2026 Formato accesible_accesible.html')
out.append({'doc':'Proyecto de Anexo Técnico Docentes 2026','entity':'*','kind':'anexo','chunks':parse(anexo,'anexo')})
for f in sorted(glob.glob(os.path.join(BASE,'ACUERDOS DOCENTES Y DIRECTIVOS DOCENTOS ACCESIBLES','*.html'))):
    ent=os.path.basename(f)[:-5].replace('Proyecto de Acuerdo ','')
    out.append({'doc':'Proyecto de Acuerdo – '+ent,'entity':ent,'kind':'acuerdo','chunks':parse(f,'acuerdo')})
json.dump(out,open(os.path.join(HERE,'raw.json'),'w',encoding='utf-8'),ensure_ascii=False)
tot=sum(len(c['text']) for d in out for c in d['chunks'])
uniq=len(set(c['text'] for d in out for c in d['chunks']))
print('docs',len(out),'chunks',sum(len(d['chunks']) for d in out),'chars',tot,'uniq',uniq)
uc=sum(len(t) for t in set(c['text'] for d in out for c in d['chunks']))
print('uniq chars',uc)
