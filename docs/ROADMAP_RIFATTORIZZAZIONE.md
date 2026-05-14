# Roadmap Dettagliata di Rifattorizzazione RagIndex

Questo documento elenca ogni singola modifica pianificata. Ogni punto deve essere smarcato `[x]` solo dopo l'implementazione e il test.

## 1. File: `static/js/llmclient/gemini_client.js`

### Standard e Documentazione
- [ ] Aggiungere header `@fileoverview` e `@module` in italiano.
- [ ] Verificare/Assicurare `"use strict";` (rimuovere `@format` se presente come unico header).

### Funzione: `convertToGemPayload`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **RETURN STRICT**: Assegnare `geminiPayload` a una variabile esplicita prima del return (già fatto, ma verificare consistenza).
- [ ] Verificare che non ci siano operazioni nei template literals.

### Classe: `GeminiClient` - Metodo: `sendRequest`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **RETURN STRICT**: Assegnare il risultato a `result` prima di ogni `return`.
- [ ] **TEMPLATE LITERAL STRICT**: Estrarre `modelName` e `apiKey` in variabili pulite prima dell'uso nell'URL.

### Classe: `GeminiClient` - Metodo: `_fetch`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **LOGICA**: Risolvere potenziale race condition tra `setTimeout` e `AbortController` (assicurarsi che `timeoutId` sia sempre pulito).
- [ ] **RETURN STRICT**: Assegnare a variabile prima del return per tutti i rami (ok, error, cancellation).

### Classe: `GeminiClient` - Metodo: `_handleHttpError`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **TEMPLATE LITERAL STRICT**: Preparare `errMsg` e `status` in una variabile per l'alert e per l'oggetto errore.
- [ ] **RETURN STRICT**: Assegnare `errorObj` a variabile prima del return.

### Classe: `GeminiClient` - Metodo: `_handleNetworkError`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **TEMPLATE LITERAL STRICT**: Preparare il messaggio dell'alert in una variabile dedicata.
- [ ] **RETURN STRICT**: Assegnare a variabile prima del return.

### Classe: `GeminiClient` - Metodi: `_createResult` e `_createError`
- [ ] Aggiungere JSDoc completa in italiano.
- [ ] **RETURN STRICT**: Assegnare l'oggetto a una variabile (es. `res` o `err`) prima del return.

---

## 2. File: `static/js/rag_worker.js`

### Standard e Funzioni Denominate
- [ ] Convertire `_processText` in `function _processText(text) { ... }`.
- [ ] Convertire `_buildIndex` in `function _buildIndex(indexEntries) { ... }`.
- [ ] Convertire `_chunkDocument` in `async function _chunkDocument(text, docIndex) { ... }`.
- [ ] Convertire `finalizeParent` (interna a `_chunkDocument`) in funzione denominata.
- [ ] Convertire `_createKnowledgeBase` in `async function _createKnowledgeBase(documents) { ... }`.

### Documentazione
- [ ] Integrare/Verificare JSDoc in italiano per tutte le funzioni sopra citate.

---

## 3. File: `static/js/rag_engine.js`

### Gestione Risorse e Worker
- [ ] **LOGICA**: Implementare `_workerReadyPromise` per garantire che il worker sia inizializzato prima dell'uso.
- [ ] **LOGICA**: In `_worker.onmessage`, assicurare la pulizia di `_requestPromises` anche in scenari di errore imprevisti.
- [ ] **LOGICA**: In `_worker.onerror`, svuotare correttamente l'oggetto `_requestPromises` dopo aver rigettato le promesse pendenti.

### Funzione: `_distillQuery`
- [ ] **TEMPLATE LITERAL STRICT**: Estrarre la logica di costruzione del `promptText` assicurandosi che `${query}` sia l'unica variabile e sia preparata.
- [ ] **RETURN STRICT**: Assegnare il risultato a variabile prima del return.

### Funzione: `buildContext`
- [ ] **RETURN STRICT**: Assegnare `context` a variabile finale prima del return.
- [ ] **JSDoc**: Aggiungere JSDoc completa in italiano.

---

## 4. File: `static/js/app_ui.js` (Analisi preliminare)
- [ ] Identificare funzioni di aggiornamento DOM concorrenti.
- [ ] Proporre/Implementare un semaforo o una coda di aggiornamento per la UI.

---

## Istruzioni per il Test
Dopo ogni blocco di modifiche (es. dopo aver sistemato una funzione o un file):
1. Verificare che non ci siano errori di sintassi.
2. Eseguire un test di "Ingestion" e "Query" se possibile.
3. Attendere conferma dall'utente prima di procedere al blocco successivo.
