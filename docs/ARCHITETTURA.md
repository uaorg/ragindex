# Architettura RagIndex

## Panoramica

Questa directory contiene il codice sorgente dell'applicazione web RagIndex.

## Struttura Modulare

L'architettura del progetto è stata riorganizzata per garantire massima manutenibilità:

### Architettura CSS
Il progetto utilizza LESS organizzato in moduli per massimizzare la manutenibilità:
- `static/less/style.less`: File orchestratore che importa i moduli.
- `static/less/modules/`: Directory contenente i pezzi atomici del layout e dello stile:
    - `variables.less`: Palette colori, font e costanti tematiche.
    - `layout_base.less`: Layout "gabbia" (flexbox, altezze) riutilizzabile.
    - `layout.less`: Logica di layout specifica (input/output).
    - `components.less`: Componenti UI (menu, bottoni, tabelle).

### Data Repository Pattern
L'accesso ai dati è stato centralizzato. Ogni interazione con il database non avviene più direttamente tramite il gestore di basso livello (`idb_mgr.js`), ma passa attraverso `DataRepository`. Ciò garantisce che la logica di persistenza sia isolata dalla logica di business.

## Struttura Directory (Semplificata)

```
static/
├── index.html              # Punto di ingresso
├── js/                     # Moduli applicativi
│   ├── services/           # Servizi generici
│   │   ├── config.js       # [NEW] Configurazione ambiente (Sviluppo/Produzione)
│   │   ├── data_repository.js # [NEW] Interfaccia unica per i dati
│   │   ├── idb_mgr.js      # Gestore IndexedDB (Dexie.js)
│   │   └── ...
│   └── ...
├── less/                   # Fogli di stile Less
│   ├── style.less
│   └── modules/            # Moduli LESS:
│       ├── variables.less
│       ├── layout_base.less
│       ├── layout.less
│       └── components.less
└── ...
```

## Gestione Ambiente
Il sistema utilizza `config.js` per gestire le differenze tra ambiente locale (sviluppo) e produzione. In locale è possibile bypassare il login e disattivare la telemetria per semplificare il workflow di sviluppo. Per dettagli, vedere `docs/SVILUPPO_LOCALE.md`.

## BEST_PRACTICES APPLICATE (v0.4.0)

### 1. Lingua
- **Commenti e docstring**: Italiano
- **Variabili e funzioni**: Inglese

### 2. Return Strict (OBBLIGATORIO)
Ogni funzione assegna il risultato a una variabile esplicita prima di restituirlo. Vietati return di espressioni o chiamate a funzioni.

### 3. Template Literal Strict (OBBLIGATORIO)
Le parentesi `${}` possono contenere solo nomi di variabili già pronte. Vietate operazioni o trasformazioni inline.

### 4. Async/Await
Niente Promise chain con `.then()`.

### 5. Struttura Modulo (Factory Pattern)
Per moduli con stato privato (isolamento dati). Uso di funzioni nominate per factory e closure.

### 6. Parsing Markdown Professionale
Integrazione di **Marked.js** per la generazione di HTML semantico e sicuro, sostituendo i parser regex manuali.

### 7. UI Compatta (LESS)
Utilizzo di moduli LESS con azzeramento dei margini verticali per un output denso e professionale.
