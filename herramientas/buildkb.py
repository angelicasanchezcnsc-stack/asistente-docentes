import json,re,collections,os
HERE=os.path.dirname(os.path.abspath(__file__))
d=json.load(open(os.path.join(HERE,'raw.json'),encoding='utf-8'))
BASURA=re.compile(r'(Documento generado con Lexible|©\s*CNSC|Tiempo estimado de lectura|NOTA LEGAL DE VALIDEZ)',re.I)
def limpiar(txt):
    out=[];toc=False
    for l in txt.split('\n'):
        if BASURA.search(l): continue
        if l.strip()=='Contenido': toc=True; continue
        if toc and re.search(r'\s\d{1,3}$',l): continue
        out.append(l)
    return '\n'.join(out)
SKIP=re.compile(r'^(Encabezado|CONSIDERANDO|ACUERDA)',re.I)
texts=[];tix={}
def T(s):
    if s not in tix: tix[s]=len(texts); texts.append(s)
    return tix[s]
def split(text,maxc=1400):
    lines=text.split('\n'); parts=[];cur=''
    for l in lines:
        if cur and len(cur)+len(l)>maxc: parts.append(cur); cur=l
        else: cur=(cur+'\n'+l) if cur else l
    if cur: parts.append(cur)
    # carry heading line to following parts
    if len(parts)>1:
        h=lines[0][:160]
        parts=[parts[0]]+[h+' (continuación)\n'+p for p in parts[1:]]
    return parts
docs=[]
for x in d:
    ch=[]
    for c in x['chunks']:
        if SKIP.match(c['label']) or SKIP.match(c['title']): continue
        txt=limpiar(c['text']).strip()
        if len(txt)<45 and '\n' not in txt: continue
        if x['kind']=='anexo' and '\n' not in txt: continue  # solo título de numeral
        for i,p in enumerate(split(txt)):
            ch.append([c['label'],T(p),i])
    docs.append({'name':x['doc'],'entity':x['entity'],'kind':x['kind'],'chunks':ch})
# modal acuerdo: most common text per (label,part) across acuerdos
cnt=collections.defaultdict(collections.Counter); order=[]
for x in docs[1:]:
    for l,t,i in x['chunks']:
        k=(l,i)
        if k not in cnt: order.append(k)
        cnt[k][t]+=1
modal=[]
for k in order:
    t,n=cnt[k].most_common(1)[0]
    modal.append([k[0],t,k[1],n])
kb={'version':'Proyectos para participación ciudadana (borrador, no definitivos)','fecha':'2026-10-05','nAcuerdos':len(docs)-1,'texts':texts,'docs':docs,'modal':modal}
s=json.dumps(kb,ensure_ascii=False,separators=(',',':'))
open(os.path.join(HERE,'kb.json'),'w',encoding='utf-8').write(s)
print(len(texts),len(s), len(modal), sum(len(x['chunks']) for x in docs))
