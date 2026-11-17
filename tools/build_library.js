#!/usr/bin/env node
// build_library.js — aggiunge "Il Profeta" (italiano, inglese, francese) al sito e crea la Biblioteca.
//
// Uso (dalla radice del repository):  node tools/build_library.js
//
// Cosa fa:
//  1. legge i dati di tools/prophet-data/ (en.json con la struttura, it.json e fr.json con le traduzioni);
//  2. scrive site/prophet/{it,en,fr}/: copertina+indice, 28 capitoli, note e licenza;
//  3. scrive la nuova pagina iniziale site/index.html ("Biblioteca") e sposta quella vecchia
//     (l'indice del libro di psicologia) in site/psicologia.html;
//  4. aggiunge il collegamento "Biblioteca" nella barra in alto delle pagine di psicologia.
// È ripetibile: rilanciarlo non duplica nulla.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA = path.join(__dirname, 'prophet-data');
const LANGS = ['it', 'en', 'fr'];

// Dimensioni di visualizzazione delle illustrazioni, prese dall'edizione HTML di Gutenberg (px).
const IMG_W = { '0007': 422, '0008': 200, '0020': 457, '0029': 458, '0032': 460, '0039': 457, '0042': 461, '0064': 458, '0083': 462, '0100': 453, '0119': 460, '0125': 462, '0134': 462 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- testi dell'interfaccia, per lingua ----------
const UI = {
  it: {
    htmlLang: 'it', bookTitle: 'Il Profeta', author: 'Kahlil Gibran', year: '1923', library: 'Biblioteca',
    chapters: 'Capitoli', filter: 'Cerca un capitolo…', prev: 'Capitolo precedente', next: 'Capitolo successivo',
    home: 'Copertina e indice', about: 'Note e licenza', toTop: 'Torna all\'inizio', menu: 'Indice', langLabel: 'Lingua',
    theme: 'Tema', themes: ['Auto', 'Chiaro', 'Scuro', 'Base'], text: 'Testo', sizes: ['Piccolo', 'Medio', 'Grande'],
    hint: 'Auto segue il tema del dispositivo. Base è lo stile semplice originale, senza barra laterale.',
    settings: 'Aspetto e dimensione del testo', alt: 'Illustrazione dall\'edizione del 1923', startReading: 'Inizia a leggere',
    subtitle: 'Prose poetiche', langName: 'Italiano', startAt: 'Dal primo capitolo',
  },
  en: {
    htmlLang: 'en', bookTitle: 'The Prophet', author: 'Kahlil Gibran', year: '1923', library: 'Library',
    chapters: 'Chapters', filter: 'Search a chapter…', prev: 'Previous chapter', next: 'Next chapter',
    home: 'Cover and contents', about: 'Notes and licence', toTop: 'Back to top', menu: 'Contents', langLabel: 'Language',
    theme: 'Theme', themes: ['Auto', 'Light', 'Dark', 'Base'], text: 'Text', sizes: ['Small', 'Medium', 'Large'],
    hint: 'Auto follows your device theme. Base is the plain original style, without the sidebar.',
    settings: 'Appearance and text size', alt: 'Illustration from the 1923 edition', startReading: 'Start reading',
    subtitle: 'Prose poems', langName: 'English', startAt: 'From the first chapter',
  },
  fr: {
    htmlLang: 'fr', bookTitle: 'Le Prophète', author: 'Kahlil Gibran', year: '1923', library: 'Bibliothèque',
    chapters: 'Chapitres', filter: 'Chercher un chapitre…', prev: 'Chapitre précédent', next: 'Chapitre suivant',
    home: 'Couverture et table des matières', about: 'Notes et licence', toTop: 'Retour en haut', menu: 'Sommaire', langLabel: 'Langue',
    theme: 'Thème', themes: ['Auto', 'Clair', 'Sombre', 'Base'], text: 'Texte', sizes: ['Petit', 'Moyen', 'Grand'],
    hint: 'Auto suit le thème de l\'appareil. Base est le style simple d\'origine, sans barre latérale.',
    settings: 'Apparence et taille du texte', alt: 'Illustration de l\'édition de 1923', startReading: 'Commencer la lecture',
    subtitle: 'Poèmes en prose', langName: 'Français', startAt: 'Dès le premier chapitre',
  },
};

// ---------- note sulla provenienza (per lingua) ----------
const ABOUT = {
  it: [
    ['h2', 'Provenienza del testo'],
    ['p', '«Il Profeta» (The Prophet) di Kahlil Gibran è stato pubblicato per la prima volta nel 1923 da Alfred A. Knopf, a New York. Gibran è morto nel 1931: l\'opera è nel pubblico dominio in Svizzera, nell\'Unione europea e negli Stati Uniti.'],
    ['p', 'Il testo inglese e le illustrazioni vengono dall\'edizione elettronica n. 58585 del Project Gutenberg, che si può usare liberamente alle condizioni della licenza riportata in fondo a questa pagina.'],
    ['h2', 'Le traduzioni'],
    ['p', 'Le versioni italiana e francese sono state fatte per questo sito da un\'intelligenza artificiale (Claude, di Anthropic), paragrafo per paragrafo sul testo inglese. Non sono state riviste da un traduttore professionista e non riproducono nessuna traduzione pubblicata. Per uno studio serio o per una citazione conviene confrontarle con il testo originale inglese.'],
    ['h2', 'Licenza del Project Gutenberg'],
  ],
  en: [
    ['h2', 'Source of the text'],
    ['p', '«The Prophet» by Kahlil Gibran was first published in 1923 by Alfred A. Knopf, New York. Gibran died in 1931: the work is in the public domain in Switzerland, in the European Union and in the United States.'],
    ['p', 'The English text and the illustrations come from Project Gutenberg eBook no. 58585, which may be used freely under the terms of the licence reproduced at the bottom of this page.'],
    ['h2', 'The translations'],
    ['p', 'The Italian and French versions were made for this site by an artificial intelligence (Claude, by Anthropic), paragraph by paragraph from the English text. They have not been reviewed by a professional translator and do not reproduce any published translation. For serious study or for quotation, compare them with the English original.'],
    ['h2', 'Project Gutenberg licence'],
  ],
  fr: [
    ['h2', 'Provenance du texte'],
    ['p', '« Le Prophète » (The Prophet) de Kahlil Gibran a été publié pour la première fois en 1923 par Alfred A. Knopf, à New York. Gibran est mort en 1931 : l\'œuvre est dans le domaine public en Suisse, dans l\'Union européenne et aux États-Unis.'],
    ['p', 'Le texte anglais et les illustrations proviennent de l\'édition électronique n° 58585 du Project Gutenberg, utilisable librement aux conditions de la licence reproduite en bas de cette page.'],
    ['h2', 'Les traductions'],
    ['p', 'Les versions italienne et française ont été réalisées pour ce site par une intelligence artificielle (Claude, d\'Anthropic), paragraphe par paragraphe à partir du texte anglais. Elles n\'ont pas été relues par un traducteur professionnel et ne reproduisent aucune traduction publiée. Pour une étude sérieuse ou pour une citation, il vaut mieux les comparer avec l\'original anglais.'],
    ['h2', 'Licence du Project Gutenberg'],
  ],
};

// ---------- pezzi di pagina ----------
const rel = '../../'; // dalle pagine /prophet/<lingua>/ alla radice del sito

function settingsHtml(t) {
  const th = ['auto', 'light', 'dark', 'base'].map((k, i) => `<button data-theme-btn="${k}" aria-pressed="false">${esc(t.themes[i])}</button>`).join('\n');
  const sz = ['s', 'm', 'l'].map((k, i) => `<button data-size-btn="${k}" aria-pressed="false">${esc(t.sizes[i])}</button>`).join('\n');
  return `<div class="settings">
<button class="tb-btn" id="settings-btn" aria-expanded="false" aria-controls="settings-pop" title="${esc(t.settings)}">Aa</button>
<div class="pop" id="settings-pop" role="dialog" aria-label="${esc(t.settings)}">
<h4>${esc(t.theme)}</h4>
<div class="group">
${th}
</div>
<h4>${esc(t.text)}</h4>
<div class="group two">
${sz}
</div>
<p class="hint">${esc(t.hint)}</p>
</div></div>`;
}

const EARLY_JS = `(function(){try{var d=document.documentElement,t=localStorage.getItem('ms-theme'),s=localStorage.getItem('ms-size');if(t==='light'||t==='dark'||t==='base')d.setAttribute('data-theme',t);if(s==='s'||s==='l')d.setAttribute('data-size',s);}catch(e){}})();`;

function langSwitch(lang, pageFile) {
  // stessa pagina nelle altre lingue
  return `<span class="langs" role="group" aria-label="${esc(UI[lang].langLabel)}">${LANGS.map((l) => `<a data-lang="${l}" href="../${l}/${pageFile}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''} title="${esc(UI[l].langName)}">${l.toUpperCase()}</a>`).join('')}</span>`;
}

function sidebar(lang, chapters, current) {
  const t = UI[lang];
  const li = (href, label, key) => `<li><a href="${href}"${current === key ? ' class="active" aria-current="page"' : ''}>${esc(label)}</a></li>`;
  const items = [li('index.html', t.home, 'home')]
    .concat(chapters.map((c, i) => li(`ch${String(i + 1).padStart(2, '0')}.html`, `${i + 1}. ${c.title}`, 'ch' + (i + 1))))
    .concat([li('about.html', t.about, 'about')]).join('\n');
  return `<aside class="sidebar" aria-label="${esc(t.chapters)}"><input type="search" id="filter" placeholder="${esc(t.filter)}" aria-label="${esc(t.filter)}"><nav><details class="sb-part current" open><summary>${esc(t.bookTitle)}</summary><ul>
${items}
</ul></details></nav></aside>`;
}

function page(lang, { title, body, pageFile, chapters, current }) {
  const t = UI[lang];
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — ${esc(t.bookTitle)}</title>
<script>${EARLY_JS}</script>
<link rel="stylesheet" href="${rel}style.css">
</head>
<body>
<header class="topbar">
<button class="tb-btn" id="menu-btn" aria-label="${esc(t.menu)}"><span aria-hidden="true">&#9776;</span><span class="mb-label"> ${esc(t.menu)}</span></button>
<a class="brand" href="index.html">${esc(t.bookTitle)}</a>
<span class="spacer"></span>
<a class="tb-btn" href="${rel}index.html">${esc(t.library)}</a>
${langSwitch(lang, pageFile)}
${settingsHtml(t)}
<div class="progress" aria-hidden="true"></div>
</header>
<div class="layout has-sidebar">
${sidebar(lang, chapters, current)}
<div class="scrim"></div>
<main class="content">
<div class="wrap prophet">
${body}
</div>
</main>
</div>
<button class="tb-btn" id="to-top" aria-label="${esc(t.toTop)}">&uarr;</button>
<script src="${rel}app.js"></script>
</body>
</html>`;
}

const fig = (lang, src) => {
  const w = IMG_W[src] || 460;
  return `<figure class="plate" style="max-width:${w}px"><img src="../img/${src}.jpg" alt="${esc(UI[lang].alt)}" loading="lazy"></figure>`;
};

function chapterBody(lang, base, tr, idx, total) {
  const t = UI[lang];
  const ch = base.chapters[idx];
  const paras = tr.chapters[idx].paras;
  let k = 0;
  const out = [`<h1 class="chap-title"><span class="chap-num">${idx + 1}</span>${esc(tr.chapters[idx].title)}</h1>`];
  for (const it of ch.items) {
    if (it.t === 'img') out.push(fig(lang, it.src));
    else out.push(`<p${it.gap ? ' class="gap"' : ''}>${paras[k++]}</p>`);
  }
  if (k !== paras.length) throw new Error(`${lang} cap. ${idx + 1}: ${paras.length} paragrafi tradotti, ${k} nell'originale`);
  const prev = idx === 0 ? ['index.html', t.home] : [`ch${String(idx).padStart(2, '0')}.html`, tr.chapters[idx - 1].title];
  const next = idx === total - 1 ? ['about.html', t.about] : [`ch${String(idx + 2).padStart(2, '0')}.html`, tr.chapters[idx + 1].title];
  out.push(`<nav class="pager"><a class="prev" href="${prev[0]}"><small>&larr; ${esc(idx === 0 ? t.home : t.prev)}</small>${esc(prev[1])}</a><a class="next" href="${next[0]}"><small>${esc(idx === total - 1 ? t.about : t.next)} &rarr;</small>${esc(next[1])}</a></nav>`);
  return out.join('\n');
}

function homeBody(lang, tr, total) {
  const t = UI[lang];
  const list = tr.chapters.map((c, i) => `<li><a href="ch${String(i + 1).padStart(2, '0')}.html">${i + 1}. ${esc(c.title)}</a></li>`).join('\n');
  return `<header class="hero"><img src="../img/cover.jpg" alt="${esc(t.bookTitle)}"><h1>${esc(t.bookTitle)}</h1><p class="subtitle">${esc(t.author)} · ${esc(t.year)}<br>${esc(t.subtitle)}</p><a class="btn-primary" href="ch01.html">${esc(t.startReading)}</a></header>
<h2 class="toc-h">${esc(t.chapters)}</h2>
<ol class="chapter-list">
${list}
</ol>
<p class="about-link"><a href="about.html">${esc(t.about)}</a></p>`;
}

function aboutBody(lang, lic, total) {
  const t = UI[lang];
  const out = [`<h1>${esc(t.about)}</h1>`];
  for (const [tag, text] of ABOUT[lang]) out.push(`<${tag}>${esc(text)}</${tag}>`);
  out.push('<div class="license" lang="en">');
  for (const b of lic.header.concat(lic.footer)) out.push(`<${b.tag === 'p' ? 'p' : 'h3'}>${esc(b.text)}</${b.tag === 'p' ? 'p' : 'h3'}>`);
  out.push('</div>');
  out.push(`<nav class="pager"><a class="prev" href="ch${String(total).padStart(2, '0')}.html"><small>&larr; ${esc(t.prev)}</small>${esc('')}</a></nav>`);
  return out.join('\n');
}

// ---------- pagina Biblioteca ----------
function libraryHtml() {
  const prophetLinks = LANGS.map((l) => `<a class="chip" data-lang="${l}" href="prophet/${l}/index.html" hreflang="${l}" lang="${l}">${UI[l].langName}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Biblioteca</title>
<script>${EARLY_JS}</script>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="topbar">
<a class="brand" href="index.html">Biblioteca</a>
<span class="spacer"></span>
${settingsHtml(UI.it)}
</header>
<main class="content">
<div class="wrap index-main">
<header class="hero"><h1>Biblioteca</h1><p class="subtitle">Due libri da leggere. Il tema chiaro, scuro o base vale per entrambi.</p></header>
<div class="library">
<article class="book-card">
<a class="book-cover" href="psicologia.html"><img src="img/cover.png" alt="La mente studiata"></a>
<div class="book-info"><h2><a href="psicologia.html">La mente studiata</a></h2>
<p class="meta">Yasser Oudabashi</p>
<p>Enciclopedia di psicologia in 13 parti e 83 capitoli, con appendici.</p>
<p class="chips"><a class="chip" href="psicologia.html" lang="it">Italiano</a></p></div>
</article>
<article class="book-card">
<a class="book-cover" href="prophet/it/index.html" data-prophet-link><img src="prophet/img/cover.jpg" alt="Il Profeta"></a>
<div class="book-info"><h2><a href="prophet/it/index.html" data-prophet-link>Il Profeta · The Prophet · Le Prophète</a></h2>
<p class="meta">Kahlil Gibran, 1923</p>
<p>Ventotto prose poetiche, con le illustrazioni dell'edizione originale. Si legge in italiano, inglese e francese.</p>
<p class="chips">${prophetLinks}</p></div>
</article>
</div>
</div>
</main>
<script src="app.js"></script>
</body>
</html>`;
}

// ---------- principale ----------
function main() {
  const base = JSON.parse(fs.readFileSync(path.join(DATA, 'en.json'), 'utf8'));
  const lic = JSON.parse(fs.readFileSync(path.join(DATA, 'license_en.json'), 'utf8'));
  const total = base.chapters.length;
  const tr = {
    en: { chapters: base.chapters.map((c) => ({ title: c.title, paras: c.items.filter((x) => x.t === 'p').map((x) => x.html) })) },
    it: JSON.parse(fs.readFileSync(path.join(DATA, 'it.json'), 'utf8')),
    fr: JSON.parse(fs.readFileSync(path.join(DATA, 'fr.json'), 'utf8')),
  };
  for (const lang of LANGS) {
    if (tr[lang].chapters.length !== total) throw new Error(`${lang}: ${tr[lang].chapters.length} capitoli invece di ${total}`);
    const dir = path.join(SITE, 'prophet', lang);
    fs.mkdirSync(dir, { recursive: true });
    const chs = tr[lang].chapters;
    fs.writeFileSync(path.join(dir, 'index.html'), page(lang, { title: UI[lang].home, body: homeBody(lang, tr[lang], total), pageFile: 'index.html', chapters: chs, current: 'home' }));
    for (let i = 0; i < total; i++) {
      const f = `ch${String(i + 1).padStart(2, '0')}.html`;
      fs.writeFileSync(path.join(dir, f), page(lang, { title: chs[i].title, body: chapterBody(lang, base, tr[lang], i, total), pageFile: f, chapters: chs, current: 'ch' + (i + 1) }));
    }
    fs.writeFileSync(path.join(dir, 'about.html'), page(lang, { title: UI[lang].about, body: aboutBody(lang, lic, total), pageFile: 'about.html', chapters: chs, current: 'about' }));
  }

  // pagina di scelta lingua, per chi apre /prophet/ senza lingua
  const choose = `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>The Prophet</title><script>${EARLY_JS}</script><link rel="stylesheet" href="../style.css"></head><body><main class="content"><div class="wrap index-main"><header class="hero"><img src="img/cover.jpg" alt=""><h1>Il Profeta · The Prophet · Le Prophète</h1><p class="chips">${LANGS.map((l) => `<a class="chip" data-lang="${l}" href="${l}/index.html" lang="${l}">${UI[l].langName}</a>`).join('')}</p><p><a href="../index.html">Biblioteca</a></p></header></div></main><script src="../app.js"></script></body></html>`;
  fs.writeFileSync(path.join(SITE, 'prophet', 'index.html'), choose);

  // la vecchia pagina iniziale (indice del libro di psicologia) diventa psicologia.html
  const idx = path.join(SITE, 'index.html');
  const psi = path.join(SITE, 'psicologia.html');
  if (!fs.existsSync(psi)) {
    const old = fs.readFileSync(idx, 'utf8');
    if (!old.includes('class="part-card"')) throw new Error('site/index.html non è l\'indice di psicologia: niente da spostare');
    fs.writeFileSync(psi, old);
  }
  fs.writeFileSync(idx, libraryHtml());

  // collegamento "Biblioteca" (e brand verso psicologia.html) nelle pagine di psicologia
  let patched = 0;
  for (const f of fs.readdirSync(SITE).filter((x) => /^(part\d+|psicologia)\.html$/.test(x))) {
    const p = path.join(SITE, f);
    let h = fs.readFileSync(p, 'utf8');
    if (h.includes('data-library-link')) continue;
    h = h.replace('<a class="brand" href="index.html">', '<a class="brand" href="psicologia.html">')
      .replace('<span class="spacer"></span>', '<span class="spacer"></span>\n<a class="tb-btn" data-library-link href="index.html">Biblioteca</a>');
    fs.writeFileSync(p, h);
    patched++;
  }
  console.log(`Fatto: Il Profeta in ${LANGS.length} lingue (${total} capitoli ciascuna), Biblioteca, ${patched} pagine di psicologia aggiornate.`);
}

main();
