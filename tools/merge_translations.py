# Unisce i file di traduzione a lotti (out_<lingua>_<lotto>.json) in tools/prophet-data/<lingua>.json
# e controlla: 28 capitoli, stesso numero di paragrafi dell'originale, tag <i>/<b> bilanciati,
# nessun paragrafo vuoto. Uso: python3 tools/merge_translations.py <cartella-lotti>
import sys, os, json, re
src = sys.argv[1]
here = os.path.join(os.path.dirname(__file__), 'prophet-data')
en = json.load(open(os.path.join(here, 'en.json'), encoding='utf8'))
need = [[x['html'] for x in c['items'] if x['t'] == 'p'] for c in en['chapters']]
problems = 0
for lang in ('it', 'fr'):
    got = {}
    for b in 'ABCDE':
        f = os.path.join(src, f'out_{lang}_{b}.json')
        if not os.path.exists(f): print('MANCA', f); problems += 1; continue
        for c in json.load(open(f, encoding='utf8')): got[c['ch']] = c
    chapters = []
    for i, paras in enumerate(need):
        c = got.get(i)
        if not c: print(lang, 'manca il capitolo', i); problems += 1; continue
        if len(c['paras']) != len(paras): print(lang, i, 'paragrafi', len(c['paras']), 'invece di', len(paras)); problems += 1
        for k, p in enumerate(c['paras']):
            if not p.strip(): print(lang, i, k, 'vuoto'); problems += 1
            for tag in ('i', 'b'):
                if p.count(f'<{tag}>') != p.count(f'</{tag}>'): print(lang, i, k, 'tag', tag); problems += 1
            if re.search(r'<(?!/?(i|b)>|br/>)', p): print(lang, i, k, 'tag non ammesso:', p[:60]); problems += 1
        chapters.append({'title': c['title'], 'paras': c['paras']})
    json.dump({'chapters': chapters}, open(os.path.join(here, f'{lang}.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(lang, len(chapters), 'capitoli,', sum(len(c['paras']) for c in chapters), 'paragrafi')
print('problemi:', problems)
sys.exit(1 if problems else 0)
