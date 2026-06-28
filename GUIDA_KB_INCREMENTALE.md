# GUIDA IMPLEMENTAZIONE — KB Incrementale

## Riepilogo Decisioni

- **Solo aggiunta documenti** — niente modifica o rimozione (per ora)
- **Indice Lunr ricostruito da zero** ogni volta, ma da child chunk già pronti (NLP già fatto)
- **Chunking (NLP)** solo per i documenti nuovi
- **"Documenti Processati"** nel menu sotto Knowledge Base

---

## 1. Menu "Documenti Processati"

### `static/index.html`

Aggiungere voce menu sotto `menu-restore-kb`:

```html
<li><a href="#" id="menu-processed-docs">Documenti Processati</a></li>
```

### `static/js/app_ui.js`

**Import** — aggiungere:

```js
import { DocsMgr } from "./docs_mgr.js";
```

Se non già importato. (Controllare — `DocsMgr` potrebbe essere già usato altrove.)

**Event binding** — in `bindEventListener()`, aggiungere nell'oggetto `ids`:

```js
"menu-processed-docs": _actionShowProcessedDocs,
```

**Handler** — nella sezione `// GESTORI AZIONI MENU (Privati)`:

```js
const _actionShowProcessedDocs = async function() {
    const kbDoclist = await UaDb.read(DATA_KEYS.KB_DOCLIST) || [];
    const allDocs = await DocsMgr.names() || [];
    const jfh = UaJtfh();
    jfh.append('<div><h4>Documenti Processati nella KB</h4>');
    if (kbDoclist.length === 0) {
        jfh.append('<p>Nessuna Knowledge Base ancora costruita.</p>');
    } else {
        jfh.append('<table class="table-data"><tbody>');
        kbDoclist.forEach(function(name) {
            const stillPresent = allDocs.includes(name);
            const status = stillPresent ? '<span style="color:#00bd97;">presente</span>' : '<span style="color:#e82323;">rimosso</span>';
            jfh.append(`<tr><td>${name}</td><td>${status}</td></tr>`);
        });
        jfh.append('</tbody></table>');
    }
    jfh.append('</div>');
    wnds.winfo.show(jfh.html());
};
```

**HelpPopup** — aggiungere:

```js
HelpPopup.bind("menu-processed-docs", "<strong>Documenti Processati</strong><br>Mostra l'elenco dei documenti usati nell'ultima costruzione della Knowledge Base, con indicazione di quali sono ancora presenti tra i caricati.");
```

---

## 2. Storage Keys

### `static/js/services/data_keys.js`

Aggiungere:

```js
export const DATA_KEYS = {
    // ... esistenti ...
    KB_DOCLIST: "kb_doclist",         // Array di nomi documenti usati nell'ultimo build
    KB_CHILDCHUNKS: "kb_childchunks", // Oggetto { "docName": [{id, body, keywords, entities}] }
};
```

---

## 3. Worker — Nuovo Comando `"chunkDocuments"`

### `static/js/rag_worker.js`

Aggiungere handler:

```js
const _chunkDocuments = function(documents, startDocIndex) {
    const allParents = [];
    const allChildEntries = [];
    documents.forEach(function(doc, i) {
        const docIdx = startDocIndex + i;
        const result = _chunkDocument(doc.text, docIdx);
        allParents.push(result.parents);
        allChildEntries.push({
            docName: doc.name,
            children: result.children,
            docIndex: docIdx
        });
    });
    return { parents: allParents.flat(), childEntries: allChildEntries };
};
```

E nell'`onmessage`:

```js
if (data.command === "chunkDocuments") {
    const result = _chunkDocuments(data.documents, data.startDocIndex);
    self.postMessage({ status: "complete", result: result });
}
```

Nota: la funzione `_chunkDocument()` già esiste nel worker (usata da `_createKnowledgeBase`). Va estratta/riusata. Restituisce `{ parents: [...], children: [...] }` — va verificato il formato esatto.

---

## 4. RAG Engine — Metodo `chunkDocumentsAsync`

### `static/js/rag_engine.js`

Aggiungere:

```js
chunkDocumentsAsync: async function(documents, startDocIndex) {
    const worker = new Worker(WORKER_PATH);
    return new Promise(function(resolve, reject) {
        worker.onmessage = function(e) {
            const data = e.data;
            if (data.status === "complete") {
                worker.terminate();
                resolve(data.result);
            } else {
                worker.terminate();
                reject(new Error("chunkDocuments error: " + (data.error || "unknown")));
            }
        };
        worker.onerror = function(err) {
            worker.terminate();
            reject(err);
        };
        worker.postMessage({
            command: "chunkDocuments",
            documents: documents,
            startDocIndex: startDocIndex
        });
    });
},
```

---

## 5. `createKnowledgeAsync` — Logica Incrementale

### `static/js/app_ui.js`

Modificare `TextInput.createKnowledgeAsync()`:

```js
createKnowledgeAsync: async function() {
    const docNames = await DocsMgr.names();
    if (!docNames || docNames.length === 0) {
        return alert("Nessun documento caricato. Carica almeno un file prima di creare la KB.");
    }

    // Leggi i documenti
    const validDocs = [];
    for (const name of docNames) {
        const text = await DocsMgr.doc(name);
        if (!text || text.length < 50) continue;
        validDocs.push({ name, text });
    }
    if (validDocs.length === 0) {
        return alert("Nessun documento valido (almeno 50 caratteri).");
    }

    const docCount = validDocs.length;
    if (!await confirm(`Creare Knowledge Base con ${docCount} documento/i?`)) return;

    showSpinner(true);

    // --- INIZIO LOGICA INCREMENTALE ---
    const existingDoclist = await UaDb.read(DATA_KEYS.KB_DOCLIST) || [];
    const existingChildChunks = await idbMgr.read(DATA_KEYS.KB_CHILDCHUNKS) || {};

    // Determina documenti nuovi
    const existingNames = new Set(existingDoclist);
    const newDocs = validDocs.filter(function(d) { return !existingNames.has(d.name); });

    let allParentChunks = [];
    let allChildChunksByDoc = {};
    let nextDocIndex = 0;

    if (existingDoclist.length === 0 || newDocs.length === validDocs.length) {
        // --- FULL REBUILD ---
        const kbData = await ragEngine.createKnowledgeBase(validDocs);
        allParentChunks = kbData.chunks;
        // Ricostruisci child chunks dall'indice? No — va estratto dal worker.
        // Soluzione: usare `chunkDocuments` con tutti i doc per avere child chunks.
        // Oppure modificare `createKnowledgeBase` nel worker per restituire anche child entries.
    } else {
        // --- UPDATE INCREMENTALE ---
        // 1. Carica chunk esistenti
        const existingParents = await idbMgr.read(DATA_KEYS.PHASE0_CHUNKS) || [];
        
        // 2. Calcola startDocIndex per i nuovi documenti
        //    Deve essere maggiore di tutti gli indici usati nei chunk esistenti.
        //    I chunk hanno id "d<docIdx>p<parentIdx>" — estrarre docIdx max
        let maxDocIdx = -1;
        for (const chunk of existingParents) {
            const match = chunk.id.match(/^d(\d+)p/);
            if (match) {
                const idx = parseInt(match[1], 10);
                if (idx > maxDocIdx) maxDocIdx = idx;
            }
        }
        nextDocIndex = maxDocIdx + 1;

        // 3. Chunka solo i nuovi documenti
        const chunkResult = await ragEngine.chunkDocumentsAsync(
            newDocs.map(function(d) { return { name: d.name, text: d.text }; }),
            nextDocIndex
        );

        // 4. Unisci parent chunk
        allParentChunks = existingParents.concat(chunkResult.parents);

        // 5. Unisci child chunk
        for (const name of Object.keys(existingChildChunks)) {
            allChildChunksByDoc[name] = existingChildChunks[name];
        }
        for (const entry of chunkResult.childEntries) {
            allChildChunksByDoc[entry.docName] = entry.children;
        }

        // 6. Ricostruisci indice Lunr da tutti i child chunk
        const allIndexEntries = [];
        for (const name of Object.keys(allChildChunksByDoc)) {
            for (const child of allChildChunksByDoc[name]) {
                allIndexEntries.push(child);
            }
        }
        
        // Ricostruisci indice nel main thread
        const serializedIndex = await _rebuildLunrIndex(allIndexEntries);
        
        // 7. Salva
        await idbMgr.create(DATA_KEYS.PHASE0_CHUNKS, allParentChunks);
        await idbMgr.create(DATA_KEYS.PHASE1_INDEX, serializedIndex);
        await idbMgr.create(DATA_KEYS.KB_CHILDCHUNKS, allChildChunksByDoc);
        await UaDb.save(DATA_KEYS.KB_DOCLIST, validDocs.map(function(d) { return d.name; }));

        await UaDb.delete(DATA_KEYS.ACTIVE_KB_NAME);
        await updateActiveKbDisplay();
        showSpinner(false);
        await alert(`Knowledge Base aggiornata. ${newDocs.length} nuovo/i documento/i elaborato/i. ${existingParents.length} chunk esistenti mantenuti.`);
        return;
    }

    // (per il full rebuild, salva come prima ma anche kb_doclist e kb_childchunks)
    await idbMgr.create(DATA_KEYS.PHASE0_CHUNKS, allParentChunks);
    await idbMgr.create(DATA_KEYS.PHASE1_INDEX, kbData.serializedIndex);
    // ... salva kb_doclist e kb_childchunks dal full result ...
},
```

---

## 6. Helper `_rebuildLunrIndex`

### `static/js/app_ui.js`

Nel main thread (non worker):

```js
const _rebuildLunrIndex = async function(indexEntries) {
    // Lunr è caricato globalmente via <script>
    const idx = window.lunr(function() {
        this.use(window.lunr.it);
        this.ref("id");
        this.field("body");
        indexEntries.forEach(function(entry) {
            const fullText = entry.body + " " + (entry.keywords || []).join(" ") + " " + (entry.entities || []).join(" ");
            this.add({ id: entry.id, body: fullText });
        });
    });
    return JSON.stringify(idx);
};
```

---

## 7. Worker — Estrarre `_chunkDocument`

### `static/js/rag_worker.js`

La funzione `_chunkDocument()` già esiste. Va resa accessibile sia da `_createKnowledgeBase` che dal nuovo handler `chunkDocuments`. Probabilmente è già una funzione separata. Verificare.

L'importante è che `_chunkDocument(text, docIndex)` restituisca un oggetto con struttura chiara:

```js
{
    parents: [{ id: "d0p0", text: "...", source: "doc_0" }, ...],
    children: [{ id: "d0p0#0", body: "...", keywords: [...], entities: [...] }, ...]
}
```

---

## 8. Cose da Verificare

- [ ] `lunr` globale è disponibile nel main thread? Sì, caricato via `<script src="js/services/vendor/lunr.js">` — accessibile come `window.lunr`.
- [ ] Worker restituisce già parent e child separatamente in `_createKnowledgeBase`? Se no, modificare.
- [ ] `DocsMgr.doc()` esiste? Sì, restituisce il testo per nome file.
- [ ] `UaDb.read()` e `UaDb.save()` funzionano con array? Sì.
- [ ] `idbMgr.read()` e `idbMgr.create()` — formato dati identico a `ph0_chunks`.

---

## Riepilogo File da Modificare

| File | Cosa |
|---|---|
| `static/index.html` | Aggiungere `<li>` per "Documenti Processati" |
| `static/js/data_keys.js` | Aggiungere `KB_DOCLIST` e `KB_CHILDCHUNKS` |
| `static/js/rag_worker.js` | Aggiungere handler `"chunkDocuments"` |
| `static/js/rag_engine.js` | Aggiungere `chunkDocumentsAsync()` |
| `static/js/app_ui.js` | Modificare `createKnowledgeAsync()` + `_rebuildLunrIndex()` + `_actionShowProcessedDocs()` + event binding + HelpPopup |
