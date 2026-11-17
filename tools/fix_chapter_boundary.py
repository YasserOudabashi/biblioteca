# Correzione di un confine di capitolo: nell'EPUB di Gutenberg l'ancora dell'indice di "On Love" cade sul
# paragrafo "People of Orphalese, of what can I speak…", che è invece la fine de "The Coming of the Ship"
# (la risposta del Profeta). Sposta quel paragrafo in fondo al capitolo 1 in en.json, it.json e fr.json.
# Idempotente: se il paragrafo è già al suo posto, non fa nulla.
import json, os, re
here = os.path.join(os.path.dirname(__file__), 'prophet-data')
en = json.load(open(os.path.join(here, 'en.json'), encoding='utf8'))
ch1 = en['chapters'][1]['items']
first = next(i for i, x in enumerate(ch1) if x['t'] == 'p')
if not re.sub('<[^>]+>', '', ch1[first]['html']).startswith('People of Orphalese'):
    print('già corretto'); raise SystemExit
moved = ch1.pop(first)
items0 = en['chapters'][0]['items']
last = max(i for i, x in enumerate(items0) if x['t'] == 'p')
items0.insert(last + 1, moved)
json.dump(en, open(os.path.join(here, 'en.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
for lang in ('it', 'fr'):
    d = json.load(open(os.path.join(here, f'{lang}.json'), encoding='utf8'))
    p = d['chapters'][1]['paras'].pop(0)
    d['chapters'][0]['paras'].append(p)
    json.dump(d, open(os.path.join(here, f'{lang}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('spostato:', re.sub('<[^>]+>', '', moved['html'])[:60])
