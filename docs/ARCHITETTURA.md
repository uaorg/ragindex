# Architettura RagIndex

## Panoramica

RagIndex è una web app statica (zero build, no npm) che implementa una pipeline RAG
completamente lato client. Il codice è organizzato in moduli ES2020+ con separation of concerns:
servizi puri, client LLM, UI, e worker.

## Architettura CSS

Il progetto usa LESS compilato lato client via `less.js` (CDN).
- `static/less/style.less` — orchestratore che importa 14 moduli atomici
- `static/less/modules/` — 14 file `.less` (layout, componenti, temi, tabelle, upload, spinner, etc.)
- `static/less/uadialog.less`, `ualog3.less`, `tooltip.less` — stili indipendenti per finestre e log

## Architettura JS

Il flusso principale segue questo percorso d'inizializzazione:

```
static/index.html
  └─ js/app.js                   ← entry point ES module
       ├─ services/              ← servizi puri (nessun DOM)
       │   ├─ config.js          ← flag ambiente (locale/produzione)
       │   ├─ worker_path.js     ← WORKER_PATH per il Web Worker
       │   ├─ key_retriever.js   ← gestione API key (offuscate)
       │   ├─ sender.js          ← telemetria opzionale
       │   ├─ ualog3.js          ← logger UI
       │   ├─ uajtfh.js          ← costruttore HTML safe
       │   ├─ uawindow.js        ← gestione finestre flottanti
       │   ├─ uadb.js            ← CRUD IndexedDB
       │   ├─ idb_mgr.js         ← layer Dexie.js
       │   ├─ backup_mgr.js      ← export/import KB e conversazioni
       │   ├─ data_keys.js       ← chiavi storage centralizzate
       │   ├─ build_state_mgr.js ← stato build incrementale KB
       │   ├─ history_utils.js   ← formattazione thread/contesto
       │   ├─ webuser_id.js      ← identità utente
       │   └─ vendor/            ← librerie esterne (dexie, marked, lunr, pdf.js, etc.)
       ├─ llmclient/             ← 6 client LLM (gemini, mistral, groq, openrouter, cerebras, siliconflow)
       │   ├─ base_client.js     ← classe base (fetch, timeout, errori)
       │   ├─ models.js          ← validazione payload
       │   └─ index.js           ← re-export centralizzato
       ├─ llm_provider.js        ← state manager provider/modello/chiave attivo
       ├─ app_mgr.js             ← orchestratore init e configurazione
       ├─ app_ui.js              ← UI, event binding, comandi
       ├─ rag_engine.js          ← motore RAG (buildContext, distillazione, retry)
       ├─ rag_worker.js          ← Web Worker (chunking + indicizzazione Lunr)
       ├─ uploader.js            ← upload documenti (PDF, DOCX, TXT)
       ├─ docs_mgr.js            ← gestione documenti
       └─ llm_prompts.js         ← template prompt
```

## Gestione Ambiente
Il sistema utilizza `config.js` per gestire le differenze tra ambiente locale (sviluppo) e produzione. In locale è possibile bypassare il login e disattivare la telemetria per semplificare il workflow di sviluppo. Per dettagli, vedere `docs/SVILUPPO_LOCALE.md`.

## Convenzioni di Codice

Le regole vincolanti (Return Strict, Template Literal Strict, Fail Fast, Factory Pattern, async/await)
sono documentate in `.agents/skills/javascript/SKILL.md` (800+ righe) e in `docs/BEST_PRACTICES_JS.md`.
Commenti e JSDoc in italiano, identificatori in inglese.
