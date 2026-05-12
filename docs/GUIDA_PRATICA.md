# Guida al Sistema RAG — RagIndex

> **A chi serve:** Utenti finali e chiunque voglia capire come funziona RagIndex.

---

## Cos'è e perché esiste

L'AI non può "leggere" un intero archivio di documenti ad ogni domanda: sarebbe troppo lento e costoso. RagIndex risolve questo costruendo una **knowledge base interrogabile**: trova le informazioni giuste e le passa all'AI già pronte, nel contesto corretto.

---

## Fase 1 — Costruzione della Knowledge Base

Quando carichi un documento, RagIndex esegue tre operazioni:

### 1.1 Pulizia del testo
Il file (TXT, PDF, DOCX) viene letto e ripulito: rimossi tag HTML, link e caratteri speciali, lasciando solo testo puro.

### 1.2 Segmentazione Genitore-Figlio (Parent-Child)

Questa è l'innovazione chiave. Il testo non viene tagliato a caso, ma organizzato su **due livelli**:

| Livello | Dimensione | Scopo |
|---------|------------|-------|
| **Parent** (paragrafo) | ~1000 caratteri | Fornisce **contesto completo** all'AI |
| **Child** (frase) | 1–2 frasi | Usato per la **ricerca precisa** |

**Esempio:**

> *"Il Monte Bianco è la montagna più alta d'Europa. Si trova nelle Alpi Graie. Fu scalato per la prima volta nel 1786 da Balmat e Paccard."*

- **Parent:** l'intero paragrafo sopra
- **Child 1:** "Il Monte Bianco è la montagna più alta d'Europa."
- **Child 2:** "Si trova nelle Alpi Graie."
- **Child 3:** "Fu scalato per la prima volta nel 1786 da Balmat e Paccard."

### 1.3 Indicizzazione
Ogni Child viene analizzato e inserito in un indice di ricerca (Lunr.js). Per ogni frase vengono estratte parole chiave, entità (persone, luoghi) e testo completo. Tutto viene salvato nel browser — nessun dato lascia il dispositivo.

---

## Fase 2 — Risposta a una Domanda

Quando poni una domanda, il sistema lavora in 4 passaggi:

**① Ricerca nell'indice**
Le parole chiave della domanda vengono cercate tra tutti i Child. Esempio: *"Chi ha scalato per primo il Monte Bianco?"* → trova Child 3 come risultato più pertinente.

**② Risalita al Parent**
Il sistema non usa solo la frase trovata. Risale al paragrafo completo che la contiene, così l'AI riceve tutto il contesto (non solo *chi* ha scalato, ma anche *cos'è* il Monte Bianco e *dove si trova*).

**③ Costruzione del contesto**
Vengono raccolti tutti i Parent unici trovati, ordinati per rilevanza, fino al limite di capienza del modello AI.

**④ Generazione della risposta**
L'AI riceve un messaggio strutturato così:
```
[Istruzioni]: Rispondi usando solo questo contesto.
[Contesto]:   I paragrafi recuperati.
[Domanda]:    La domanda dell'utente.
```
E produce una risposta precisa e documentata.

---

## Perché questa architettura?

| | Senza RAG | RAG semplice | RagIndex (Parent-Child) |
|--|-----------|--------------|------------------------|
| **Rischio allucinazioni** | Alto | Medio | Basso |
| **Contesto fornito all'AI** | Nessuno | Frasi spezzate | Paragrafi completi |
| **Precisione di ricerca** | — | Media | Alta |
| **Privacy** | — | Dipende | Totale (tutto in locale) |

---

## Riepilogo del flusso

```
DOCUMENTI → Pulizia → Segmentazione Parent-Child → Indicizzazione → Salvataggio locale
                                                                          ↓
DOMANDA → Ricerca Child → Risalita al Parent → Costruzione contesto → Risposta AI
```
