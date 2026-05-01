# RagIndex - Guida al Progetto

RagIndex è un'applicazione web che implementa un'architettura **RAG (Retrieval-Augmented Generation) 100% client-side**. L'intero processo di ingestione, chunking, indicizzazione e recupero avviene localmente nel browser, garantendo la massima privacy.

## Stack Tecnologico

- **Frontend**: HTML5, JavaScript (ES6 Modules).
- **Styling**: LESS (compilato dinamicaamente nel browser via `less/less.js`).
- **Database Locale**: IndexedDB gestito tramite **Dexie.js** (`static/js/services/idb_mgr.js`).
- **Motore di Ricerca**: **Lunr.js** per l'indicizzazione lessicale BM25.
- **Background Processing**: **Web Workers** (`static/js/rag_worker.js`) per gestire operazioni intensive senza bloccare la UI.
- **LLM Integration**: Client specifici per Gemini, Mistral e OpenRouter in `static/js/llmclient/`.

## Architettura del Codice

L'applicazione segue una struttura modulare:

1.  **Entry Point**: `static/js/app.js` inizializza l'applicazione e i servizi principali.
2.  **UI Controller**: `static/js/app_ui.js` gestisce l'interazione con il DOM e gli eventi.
3.  **RAG Engine**: `static/js/rag_engine.js` coordina il flusso RAG (recupero contesto e chiamata LLM).
4.  **Worker**: `static/js/rag_worker.js` esegue il chunking (Parent-Child) e l'indicizzazione.
5.  **Service Layer**:
    - `idb_mgr.js` & `data_repository.js`: Astrazione della persistenza dati.
    - `ualog3.js`: Sistema di logging custom per la UI.
    - `llm_prompts.js`: Gestione dei template per i prompt.

## Convenzioni di Sviluppo

- **Lingua**:
    - **Codice**: Nomi di variabili, funzioni, classi e file devono essere in **Inglese**.
    - **Commenti**: I commenti e la documentazione interna devono essere in **Italiano**.
- **Stile di Codice**:
    - Utilizzare sempre `"use strict";`.
    - Documentare i file con `@fileoverview` e `@module`.
    - Preferire l'uso di moduli ES6 (`import`/`export`).
    - I file LESS si trovano in `static/less/` e sono suddivisi per componenti in `static/less/modules/`.
- **Gestione Dati**:
    - I dati sensibili (API Key) e i documenti sono salvati esclusivamente in **IndexedDB**.
    - Utilizzare `DataRepository` per l'accesso ai dati invece di chiamare direttamente `idbMgr` dove possibile.

## Comandi Utili

Il progetto non richiede un sistema di build (Webpack/Vite). Per lo sviluppo locale:

- **Esecuzione**: Avviare un server statico nella root del progetto.
    - `python3 -m http.server 8000`
    - `npx http-server .`
- **Testing**: I test si trovano in `static/tests/` (verificare la struttura specifica se necessario aggiungere nuovi test).

## Documentazione

Per approfondimenti sull'architettura e le best practices, consultare la directory `/docs/`:

- `BEST_PRACTICES_JS.md`: La "Costituzione" tecnica del progetto (da seguire rigorosamente).
- `ARCHITETTURA.md`: Panoramica strutturale del sistema RAG.
- `SPECIFICHE_PIPELINE.md`: Dettagli tecnici sulle pipeline di indicizzazione.
- `GUIDA_PRATICA.md`: Guida didattica all'uso del sistema.
- `modifiche_attuate.md`: Registro dei refactoring completati (minuscolo).
- `modifiche_previste.md`: Registro dei refactoring pianificati (minuscolo).

## Struttura Directory Principale

- `/static/js/`: Logica applicativa JS.
- `/static/js/llmclient/`: Client per i diversi provider AI.
- `/static/js/services/`: Utility e servizi core (DB, log, sender).
- `/static/less/`: Sorgenti LESS per gli stili.
- `/static/data/`: Modelli di prompt e file di test.
- `/docs/`: Documentazione tecnica in formato markdown.
