<!-- @format -->

# RagIndex: Generazione Aumentata da Recupero (RAG) 100% Client-Side

**Versione:** 0.4.6

**RagIndex** è un'applicazione web che implementa un'architettura RAG (Retrieval-Augmented Generation) completa, operando interamente nel browser dell'utente. Nessun dato lascia mai il client, garantendo massima privacy e autonomia.

> 🚀 **Scopri di più**: Per una presentazione approfondita delle funzionalità e dell'implementazione tecnica, consulta la nuova pagina [ragindex.html](ragindex.html).

## Setup Rapido

Essendo un'applicazione puramente statica, non richiede build system complessi (Webpack, Vite, ecc.) né backend.

1.  **Requisiti**: Un qualsiasi web server statico (es: `python3 -m http.server`, `npx http-server .`, o l'estensione "Live Server" di VS Code).
2.  **Avvio**: Apri il browser all'indirizzo locale della cartella root.
3.  **Configurazione API**: 
    - Apri il menu laterale.
    - Seleziona **"API Keys Default"** per caricare le chiavi di prova predefinite dal file locale.
    - Oppure seleziona **"Gestisci API Key"** per inserire la tua chiave personale (Gemini, Mistral, Groq, OpenRouter, Cerebras, SiliconFlow).
    > 🛡️ **Privacy**: Le chiavi sono salvate esclusivamente nell'**IndexedDB** del tuo browser. La comunicazione AI avviene direttamente dal tuo computer al provider, senza server intermedi.

## Caratteristiche Principali

- **Privacy Assoluta**: Tutta l'elaborazione dei documenti, dall'indicizzazione alla costruzione del contesto, avviene localmente. I documenti non lasciano mai il computer dell'utente.
- **Strategia Parent-Child**: Utilizza una segmentazione gerarchica per la massima precisione:
    - **Child Chunks**: Singole frasi indicizzate per una ricerca ultra-precisa.
    - **Parent Chunks**: Paragrafi completi inviati all'AI per mantenere il contesto.
- **Zero Dipendenze da Backend**: L'applicazione è un puro front-end che sfrutta le API degli LLM direttamente dal client.
- **Ricerca Lessicale BM25**: Sfrutta `Lunr.js` per un'indicizzazione veloce e affidabile direttamente nel browser.

## Il Flusso di Lavoro a 3 Azioni

L'applicazione è progettata per essere utilizzata seguendo tre fasi sequenziali, identificate dai pulsanti numerati:

1.  **🔴 (1) Crea Knowledge Base**: Carica i tuoi documenti (PDF, TXT, DOCX) e clicca il pulsante **(1)**. Il sistema creerà l'indice di ricerca locale.
2.  **🟠 (2) Inizia Conversazione**: Scrivi la tua domanda e clicca il pulsante **(2)**. Il sistema estrarrà i frammenti pertinenti e interrogherà l'AI.
3.  **🟢 (3) Continua Conversazione**: Prosegui il dialogo cliccando il pulsante **(3)**. L'AI risponderà tenendo conto di tutta la cronologia.

## Architettura del Codice

- **UI Controller**: `static/js/app_ui.js` (Gestione DOM ed eventi).
- **RAG Engine**: `static/js/rag_engine.js` (Orchestratore del flusso RAG).
- **Worker**: `static/js/rag_worker.js` (Elaborazione intensiva in background).
- **LLM Clients**: `static/js/llmclient/` (6 provider: Gemini, Mistral, Groq, OpenRouter, Cerebras, SiliconFlow).
- **Database Locale**: `static/js/services/idb_mgr.js` (Persistenza via Dexie.js).
- **Test**: `test/test_providers.js` (Node.js, test manuale di tutti i provider con chiavi reali).

---
*RagIndex è un progetto focalizzato sulla privacy e sull'efficienza dell'AI lato client.*
