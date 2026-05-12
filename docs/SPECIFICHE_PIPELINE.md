# Specifiche Tecniche della Pipeline RAG

> **Destinatari**: Architetti software, sviluppatori, implementatori tecnici.
> **Agnostico** rispetto al linguaggio di programmazione.

---

## Panoramica

Il sistema si compone di due pipeline distinte:

1. **Pipeline di Ingestione** — trasforma documenti grezzi in una Knowledge Base indicizzata
2. **Pipeline di Retrieval** — genera un contesto pertinente a partire da una query utente

---

## Parte 1: Pipeline di Ingestione

**Input:** `Array<{nome: string, testo: string}>`  
**Output:** `Parent Chunks[]` + `Indice serializzato`

### Fase 1 — Pulizia del Testo

| Trasformazione | Esempio |
|----------------|---------|
| Decodifica entità HTML/XML | `&egrave;` → `è` |
| Rimozione tag e URL | `<p>testo</p>` → `testo` |
| Normalizzazione spazi | `"a  b"` → `"a b"` |
| Normalizzazione Unicode NFC | `é` (composto) → `é` (precomposto) |
| Rimozione caratteri di controllo | `\u200B`, `\uFEFF` → `` |

---

### Fase 2 — Segmentazione Gerarchica (Parent-Child)

**Definizioni:**

| Livello | Dimensione | Scopo |
|---------|------------|-------|
| **Parent** | ~1000 caratteri | Unità di **contesto** per l'AI |
| **Child** | 1–2 frasi (≥ 15 char) | Unità di **ricerca** nell'indice |

**Algoritmo (pseudocodice):**

```
funzione segmentaDocumento(testo, indice_doc):
    frasi = splitInFrasi(testo)
    parent_corrente = ""
    frasi_correnti = []
    
    per ogni frase:
        se (len(parent_corrente) + len(frase) > TARGET_PARENT_SIZE) e parent_corrente != "":
            finalizzaParent(indice_doc, parent_corrente, frasi_correnti)
            parent_corrente = frase
            frasi_correnti = [frase]
        altrimenti:
            parent_corrente += frase
            frasi_correnti.append(frase)
    
    se parent_corrente != "":
        finalizzaParent(...)  // flush finale
```

**Formato identificatori:**

```
Parent ID:  d{doc}p{parent}         →  es. d0p5
Child ID:   {parent_id}#{child}     →  es. d0p5#3
```

---

### Fase 3 — Estrazione Metadati (per ogni Child)

Da ogni frase vengono estratti:
- **Parole chiave**: nomi e verbi significativi (lowercase, lunghezza ≥ 3, deduplicati)
- **Entità**: persone, luoghi, organizzazioni (NER)

---

### Fase 4 — Indicizzazione

L'indice deve supportare:
- Ricerca full-text con ranking (BM25 o equivalente)
- Ricerca fuzzy e stemming multilingua (es. italiano)
- Mapping `Child ID → Parent ID`

Ogni entry indicizzata aggrega: `corpo + parole_chiave + entità`

---

### Fase 5 — Persistenza

```
storage.scrivi("ph0_chunks", parents)       // Parent Chunks
storage.scrivi("ph1_index",  indice_json)   // Indice serializzato
storage.scrivi("kb_metadata", {             // Metadati opzionali
    data_creazione, n_documenti, n_chunks, n_index_entries
})
```

### Diagramma Ingestione

```
Documenti grezzi
    → Pulizia testo
    → Segmentazione Parent-Child  (ID: d{doc}p{parent}#{child})
    → Estrazione metadati
    → Indicizzazione (BM25)
    → Persistenza in storage
    → Knowledge Base pronta
```

---

## Parte 2: Pipeline di Retrieval

**Input:** `query: string`, `indice`, `chunks[]`  
**Output:** `contesto: string` (pronto per l'LLM)

### Fase 1 — Distillazione della Query (Query Distillation)

Prima della ricerca, la query utente viene "distillata" per estrarre i termini di ricerca più efficaci (keywords). Questo processo rimuove le stop-words e trasforma una domanda colloquiale in una stringa di ricerca ottimizzata per Lunr.js.

### Fase 2 — Ricerca (Query Execution)

```
risultati = indice.cerca(distilledQuery)      // restituisce Child ordinati per score
risultati = prendiPrimi(risultati, TOP_K)    // tipico: 10–20 risultati
```

Struttura risultato: `{ id: "d0p5#3", punteggio: 0.847 }`

### Fase 3 — Risoluzione Parent

```
per ogni risultato:
    id_parent = split(risultato.id, "#")[0]   // "d0p5#3" → "d0p5"
    
    se id_parent non già visto:
        aggiungi parent_chunk corrispondente
```

**De-duplicazione:** se più Child appartengono allo stesso Parent, il Parent viene aggiunto una sola volta con il punteggio del figlio migliore.

### Fase 3 — Costruzione Contesto

I Parent vengono ordinati per score e concatenati fino al raggiungimento del **limite di contesto** (default: 70% della window size del modello).

Formato snippet:
```
--- Context: d0p5 (Score: 0.847) ---
Leonardo da Vinci nacque il 15 aprile 1452 a Vinci...
```

### Fase 4 — Preparazione Messaggio LLM

```
{
  sistema: "Sei un assistente esperto. Rispondi basandoti 
            PRIORITARIAMENTE sul CONTESTO fornito. Se il contesto
            è insufficiente, segnalalo esplicitamente.",
  contesto: <testo assemblato nella fase precedente>,
  domanda:  <query dell'utente>
}
```

**Priorità delle fonti:** (1) Contesto recuperato → (2) Conoscenza pregressa (con segnalazione esplicita)

### Diagramma Retrieval

```
Query utente
    → Ricerca Child nell'indice  (score BM25)
    → Risoluzione Parent         (mapping + deduplicazione)
    → Costruzione contesto       (ordinato, troncato al 70% window)
    → Preparazione messaggio LLM
    → Risposta generata
```

---

## Parte 3: Gestione Conversazione Multi-Turno

Lo storico viene mantenuto come array di messaggi e incluso in ogni chiamata all'LLM:

```
thread = [
    { ruolo: "user",      contenuto: "Dove nacque Leonardo?" },
    { ruolo: "assistant", contenuto: "A Vinci, il 15 aprile 1452..." },
    { ruolo: "user",      contenuto: "Quando morì?" },
    ...
]
```

Il contesto RAG rimane costante per tutta la conversazione; il thread evolve ad ogni turno e viene persistito in `storage.scrivi("thread", thread)`.

---

## Appendice A — Parametri Configurabili

| Parametro | Default | Descrizione |
|-----------|---------|-------------|
| `TARGET_PARENT_SIZE` | 1000 char | Dimensione target Parent Chunk |
| `MIN_CHILD_LENGTH` | 15 char | Lunghezza minima Child valido |
| `CONTEXT_LIMIT_PERCENT` | 70% | Quota della window size per il contesto |
| `TOP_K_RESULTS` | 10–20 | Max Child recuperati dalla ricerca |
| `MAX_TOKENS_OUTPUT` | 4000 | Max token per risposta LLM |
| `TEMPERATURE` | 0.7 | Creatività risposta LLM |

---

## Appendice B — Chiavi di Storage

| Chiave | Contenuto |
|--------|-----------|
| `ph0_chunks` | Array Parent Chunks correnti |
| `ph1_index` | Indice serializzato (JSON) |
| `ph2_context` | Ultimo contesto generato |
| `thread` | Conversazione corrente |
| `rag_kb_{name}` | Knowledge Base archiviata |
| `rag_convo_{name}` | Conversazione archiviata |

---

## Appendice C — Glossario

| Termine | Definizione |
|---------|-------------|
| **Parent Chunk** | Unità di contesto (~1000 char), tipicamente un paragrafo |
| **Child Chunk** | Unità di ricerca (singola frase), sottoinsieme di un Parent |
| **BM25** | Algoritmo di ranking per ricerca full-text |
| **Window Size** | Capacità massima in token del modello LLM |
| **Context Limit** | Quota della window size riservata al contesto (default 70%) |
| **De-duplicazione** | Eliminazione di Parent duplicati nel contesto finale |
