# Prepara le risorse de "Il Profeta" a partire dall'EPUB di Project Gutenberg (#58585):
#  - ridimensiona le illustrazioni (da ~10 MB a poche centinaia di KB) in site/prophet/img/
#  - estrae la licenza completa di Project Gutenberg in tools/prophet-data/license_en.json
# Uso: python3 tools/prep_prophet_assets.py <cartella-EPUB-decompresso>/OEBPS
import sys, os, re, json, glob
from PIL import Image
from bs4 import BeautifulSoup
src = sys.argv[1]
root = os.path.join(os.path.dirname(__file__), '..')
out_img = os.path.join(root, 'site', 'prophet', 'img')
os.makedirs(out_img, exist_ok=True)
for f in glob.glob(os.path.join(src, '*.jpg')):
    name = re.search(r'(\d{4}|cover)\.jpg$', f).group(1)
    im = Image.open(f).convert('RGB')
    maxw = 760
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(os.path.join(out_img, name + '.jpg'), 'JPEG', quality=82, optimize=True, progressive=True)
def blocks_of(path, container_sel):
    soup = BeautifulSoup(open(path, encoding='utf8').read(), 'html.parser')
    box = soup.select_one(container_sel) or soup.body
    items = []
    for el in box.find_all(['h2', 'h3', 'div', 'p', 'li']):
        if el.find(['div', 'p', 'li', 'h2', 'h3']): continue      # solo blocchi "foglia"
        if 'pg-end-separator' in (el.parent.get('id') or ''): pass
        txt = re.sub(r'\s+', ' ', el.get_text(' ')).strip()
        txt = re.sub(r'\s+([,.;:)!?])', r'\1', txt).replace('( ', '(').replace('“ ', '“').replace(' ”', '”')
        if txt: items.append({'tag': el.name if el.name in ('h2', 'h3') else 'p', 'text': txt})
    return items
header = blocks_of(os.path.join(src, '4795326317592338372_58585-h-0.htm.xhtml'), 'section.pg-boilerplate, header.pg-boilerplate, .pgheader')
footer = blocks_of(os.path.join(src, '4795326317592338372_58585-h-29.htm.xhtml'), 'footer')
json.dump({'header': header, 'footer': footer}, open(os.path.join(root, 'tools', 'prophet-data', 'license_en.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('immagini:', len(os.listdir(out_img)), '- licenza: intestazione', len(header), 'blocchi, piè', len(footer), 'blocchi')
