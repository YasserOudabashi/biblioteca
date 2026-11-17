# Biblioteca

Sito statico con due libri da leggere nel browser, con tema chiaro, scuro o base e dimensione del testo regolabile.

- **La mente studiata** (Yasser Oudabashi): enciclopedia di psicologia in 13 parti e 83 capitoli, con appendici. In italiano.
- **Il Profeta · The Prophet · Le Prophète** (Kahlil Gibran, 1923): 28 prose poetiche con le illustrazioni dell'edizione originale, in italiano, inglese e francese. Selettore di lingua in alto.

## Struttura

- `site/` è il sito già pronto: si pubblica così com'è, senza compilazione.
  - `index.html` Biblioteca · `psicologia.html` e `part01…part14.html` libro di psicologia · `prophet/{it,en,fr}/` Il Profeta.
- `tools/` contiene gli script usati per costruire la parte de Il Profeta (`build_library.js`, che richiede solo Node.js) e i dati (`prophet-data/`: testo inglese, traduzioni, licenza).
- `.github/workflows/pages.yml` pubblica `site/` su GitHub Pages ad ogni push su `main`.

Tutti i collegamenti nel sito sono relativi: funziona sia alla radice di un dominio sia in una sottocartella (`utente.github.io/biblioteca/`).

## Provenienza e licenze

- *La mente studiata* è stato scritto con l'assistenza di Claude (Anthropic) su un piano dell'autore, e verificato su fonti aperte; non è stato rivisto da un revisore umano specialista.
- *The Prophet* è nel pubblico dominio (Gibran è morto nel 1931). Testo inglese e illustrazioni vengono dall'eBook n. 58585 del Project Gutenberg; la licenza completa è nella pagina "Note e licenza" del libro. Le versioni italiana e francese sono state fatte per questo sito da un'intelligenza artificiale (Claude), non da un traduttore professionista.

## Rigenerare Il Profeta (facoltativo)

```
node tools/build_library.js
```
Riscrive `site/prophet/`, la Biblioteca e il collegamento nelle pagine di psicologia. È ripetibile.
