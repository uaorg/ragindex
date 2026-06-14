# SYSTEM INSTRUCTIONS: GUIDA SVILUPPO JAVASCRIPT (VANILLA)

> **IMPORTANTE PER L'AGENTE:** Questo documento rappresenta la "Costituzione" del codice per questo progetto. Ogni riga di codice generata DEVE aderire a queste regole. Ignorare queste direttive è considerato un errore critico.

## FILOSOFIA DI FONDO

"Il codice è fondamentalmente un testo che descrive un processo secondo regole formali, destinato ad essere letto e compreso da altri programmatori. Solo in secondo luogo è un insieme di istruzioni eseguibili da una macchina."

---

## 1. PRINCIPI FONDAMENTALI (INDEROGABILI)

1.  **Lingua:**
    *   **Commenti, JSDoc:** RIGOROSAMENTE IN **ITALIANO**.
    *   **Nomi (Variabili, Funzioni, Moduli):** RIGOROSAMENTE IN **INGLESE**.
    *   *Obiettivo:* Codice internazionale, spiegazione locale.

2.  **Chiarezza > Brevità:**
    *   Vietati i metodi concatenati complessi su una sola riga.
    *   Vietate le arrow function come sostituto di funzioni nominate dove la leggibilità ne risente.
    *   Preferire passi intermedi espliciti con variabili nominative.
    *   Il codice deve essere leggibile come un libro, dall'alto verso il basso.

3.  **No Magic:**
    *   Nessun side-effect nascosto nelle funzioni.
    *   Nessuna dipendenza implicita da variabili globali.
    *   Il flusso dei dati deve essere evidente: input → elaborazione → output.
    *   Nessun numero o stringa "magica" nel codice: usare costanti nominate.

4.  **Fail Fast:**
    *   Validazione degli input **all'inizio** di ogni funzione.
    *   Interrompere l'esecuzione immediatamente se i dati non sono validi.
    *   Non nascondere errori con `try/catch` troppo generici senza logging.

5.  **RETURN STRICT (Regola Aurea):**
    *   **VIETATO:** `return calculate(a) + b;`
    *   **VIETATO:** `return doSomething();`
    *   **VIETATO:** `return { key: value };`
    *   **VIETATO:** `return isValid ? data : null;`
    *   **OBBLIGATORIO:** Assegnare il risultato a una variabile esplicita prima di ritornarlo.
    *   *Esempio Corretto:*
        ```javascript
        const result = calculate(a) + b;
        return result;
        ```
    *   *Esempio con Oggetto:*
        ```javascript
        const response = {
            status: "success",
            data: processedData
        };
        return response;
        ```

6.  **TEMPLATE LITERAL STRICT (Regola delle Stringhe):**
    *   Le parentesi graffe `${}` di un template literal servono esclusivamente a
        inserire il valore di una variabile già pronta. Non devono mai contenere
        operazioni, chiamate a funzioni, trasformazioni o espressioni di qualsiasi tipo.
    *   **VIETATO:** `` `Risultato: ${value.trim().toUpperCase()}` ``
    *   **VIETATO:** `` `Dati: ${JSON.stringify(records)}` ``
    *   **VIETATO:** `` `Somma: ${a + b}` ``
    *   **OBBLIGATORIO:** Preparare la variabile prima, interpolre dopo.
    *   *Esempio Corretto:*
        ```javascript
        const valueFormatted = value.trim().toUpperCase();
        const text = `Risultato: ${valueFormatted}`;
        ```
    *   *Esempio con contenuto esterno (API, DOM, input utente):*
        ```javascript
        // Il contenuto esterno va sempre in una variabile descrittiva prima di essere interpolato
        const apiResponse = await fetchData(endpoint);
        const prompt = `Analizza i seguenti dati:\n${apiResponse}`;
        ```

---

## 2. JAVASCRIPT - REGOLE SPECIFICHE

**Stack:** JavaScript ES2020+ (ES Modules, async/await). Nessun framework. Web API native. Librerie esterne solo se strettamente necessario.

### 2.1 Struttura File e Header

Ogni file è un **ES Module**: usa `import`/`export` nativi. Il tag `<script>` in HTML
deve avere `type="module"`. La direttiva `"use strict"` è implicita nei moduli ES6,
ma va inclusa nei file non-modulo (es. script inline legacy).

**OBBLIGATORIO** per ogni file `.js`:

```javascript
/**
 * nomeModulo.js - Descrizione breve dello scopo.
 *
 * Descrizione dettagliata del modulo, cosa fa, perché esiste.
 * Eventuali note su dipendenze o requisiti particolari.
 *
 * @module  nomeModulo
 * @version X.Y.Z
 * @date    YYYY-MM-DD
 * @author  Nome Autore
 */

// Import da altri moduli locali
import { validateString } from "./utils.js";

// Import da moduli di terze parti (se necessario)
// import { library } from "./vendor/library.js";

// Costanti di modulo (UPPER_CASE) — visibili solo in questo file
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// ... corpo del modulo ...

// Export esplicito delle sole API pubbliche
export { loadUser, saveUser };
```

**Struttura HTML di caricamento:**

```html
<!-- type="module" è obbligatorio: abilita ES Modules e strict mode implicita -->
<script type="module" src="./js/app.js"></script>
```

### 2.2 Dichiarazione Variabili

*   `const` di default per ogni valore che non viene riassegnato.
*   `let` solo nei casi in cui la riassegnazione è effettivamente necessaria (es. contatori, accumolatori nei try/catch).
*   `var` **VIETATO** senza eccezioni.

```javascript
// ✅ Corretto
const userId = 42;
const userList = [];

let counter = 0;
let result = null; // Sarà riassegnato nel try/catch

// ❌ Vietato
var name = "Mario";
```

### 2.3 Async/Await (OBBLIGATORIO)

Usare sempre `async/await`. Le Promise chain con `.then()` sono **VIETATE**.

```javascript
// ✅ CORRETTO
const loadUser = async function(userId) {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
};

// ❌ VIETATO
const loadUser = function(userId) {
    return fetch(`/api/users/${userId}`)
        .then(r => r.json())
        .then(data => data);
};
```

### 2.4 Costanti di Modulo

Le costanti a livello di modulo vanno dichiarate in `UPPER_CASE` subito dopo gli import,
prima di qualsiasi funzione o factory. Sono private al modulo per default; si esportano
solo quelle che altri moduli devono conoscere.

```javascript
// Costanti private al modulo (non esportate)
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5000;

// Costanti esportate (parte dell'API pubblica del modulo)
export const API_BASE_URL = "https://api.example.com";
export const SUPPORTED_TYPES = ["json", "csv", "txt"];
```

### 2.5 Gestione Eccezioni

*   Non usare `catch (error) {}` vuoto o che silenzia l'errore.
*   Loggare sempre con `console.error` includendo il nome della funzione.
*   Usare variabile `result = null` prima del try, assegnarla nel try, restituirla dopo.

```javascript
const readConfig = async function(configUrl) {
    // Fail Fast
    if (!configUrl) {
        console.error("readConfig: configUrl mancante");
        return null;
    }

    let config = null;

    try {
        const response = await fetch(configUrl);

        if (!response.ok) {
            console.error(`readConfig: risposta non valida (${response.status})`);
            return null;
        }

        const data = await response.json();
        config = data;

    } catch (error) {
        console.error("readConfig:", error);
        config = null;
    }

    // Return Strict
    return config;
};
```

### 2.6 JSDoc (RACCOMANDATO)

Usare JSDoc per documentare ogni funzione pubblica, con tipi e descrizioni in italiano.

```javascript
/**
 * Calcola le statistiche di un array di numeri.
 *
 * @param {number[]} numbers       - Array di numeri da analizzare.
 * @param {boolean}  [includeMedian=false] - Se true, include la mediana.
 * @returns {Object|null} Oggetto con le statistiche, o null se input non valido.
 */
const calculateStatistics = function(numbers, includeMedian = false) {
    // Fail Fast
    if (!numbers || numbers.length === 0) {
        console.error("calculateStatistics: array vuoto o mancante");
        return null;
    }

    const total = numbers.reduce((acc, n) => acc + n, 0);
    const meanValue = total / numbers.length;
    const maxValue = Math.max(...numbers);
    const minValue = Math.min(...numbers);

    const stats = {
        mean: meanValue,
        max: maxValue,
        min: minValue
    };

    if (includeMedian) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const isEven = sorted.length % 2 === 0;

        let medianValue = null;
        if (isEven) {
            medianValue = (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            medianValue = sorted[mid];
        }

        stats.median = medianValue;
    }

    // Return Strict
    return stats;
};
```

### 2.7 Factory/Closure Pattern (STANDARD PER MODULI CON STATO DOM)

Usare il pattern factory/closure per ogni modulo che gestisce stato interno legato al DOM.
Le funzioni private sono prefissate con `_`. L'API pubblica è un oggetto esplicito
restituito alla fine della factory ed esportato dal modulo.

```javascript
/**
 * Gestore [FUNZIONALITÀ].
 * Descrizione scopo del modulo.
 *
 * @param {string} containerId - ID dell'elemento DOM contenitore.
 * @param {Object} [config={}] - Configurazione opzionale.
 * @returns {Object} API pubblica del modulo.
 */
const UaModuleName = function(containerId, config = {}) {

    // 1. STATO PRIVATO
    const _container = document.getElementById(containerId);
    let _state = null;

    // 2. FUNZIONI PRIVATE

    /**
     * Valida i dati in ingresso.
     *
     * @param {*} data - Dato da validare.
     * @returns {boolean} True se valido, false altrimenti.
     */
    const _validate = function(data) {
        if (!data) {
            return false;
        }

        const isValid = typeof data === "object";
        return isValid;
    };

    /**
     * Renderizza i dati nel contenitore DOM.
     *
     * @param {Object} data - Dati da visualizzare.
     * @returns {boolean} True se il render ha avuto successo.
     */
    const _render = function(data) {
        if (!_container) {
            console.error("UaModuleName._render: contenitore non trovato");
            return false;
        }

        const item = document.createElement("div");
        item.className = "module-item";
        item.textContent = data.label;

        _container.appendChild(item);

        const success = true;
        return success;
    };

    // 3. FUNZIONI PUBBLICHE

    /**
     * Carica i dati dal server e aggiorna lo stato interno.
     *
     * @param {string} id - Identificatore della risorsa.
     * @returns {Promise<Object|null>} Dati caricati, o null in caso di errore.
     */
    const loadAsync = async function(id) {
        // Fail Fast
        if (!id) {
            console.error("UaModuleName.loadAsync: id mancante");
            return null;
        }

        let result = null;

        try {
            const url = `/api/${id}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`UaModuleName.loadAsync: risposta non valida (${response.status})`);
                return null;
            }

            const data = await response.json();

            if (_validate(data)) {
                _state = data;
                result = data;
            }

        } catch (error) {
            console.error("UaModuleName.loadAsync:", error);
            result = null;
        }

        // Return Strict
        return result;
    };

    /**
     * Visualizza i dati correnti nel contenitore.
     *
     * @returns {boolean} True se il render ha avuto successo.
     */
    const render = function() {
        if (!_state) {
            console.error("UaModuleName.render: nessun dato caricato");
            return false;
        }

        const success = _render(_state);
        return success;
    };

    // 4. API PUBBLICA
    const api = {
        loadAsync: loadAsync,
        render: render
    };
    return api;
};

// Export: espone solo la factory, non le funzioni interne
export { UaModuleName };
```

### 2.8 Manipolazione DOM

```javascript
// ✅ Selezione
const el = document.getElementById("my-id");
const els = document.querySelectorAll(".my-class");

// ✅ Creazione elementi
const div = document.createElement("div");
div.className = "item";
div.textContent = labelText;  // Template Literal Strict: variabile già pronta

// ✅ Aggiunta al DOM
container.appendChild(div);

// ✅ Event listener
button.addEventListener("click", handleClick);

// ✅ Classi CSS
element.classList.add("active");
element.classList.remove("hidden");
element.classList.toggle("selected");

// ✅ Stili inline (solo se necessario, preferire classi CSS)
element.style.backgroundColor = backgroundColor;  // Variabile già pronta
```

### 2.9 Logging

Per ogni `console.error`, includere **sempre** il nome della funzione come prefisso.
Questo rende immediato il tracciamento dell'errore nella console.

```javascript
// ✅ Corretto: prefisso con nome funzione
console.error("loadUser: userId mancante");
console.error("UaModuleName.loadAsync:", error);

// ❌ Evitare: messaggio generico senza contesto
console.error("Errore");
console.error(error);
```

---

## 3. TEMPLATE COMPLETI

I moduli JS non hanno un "entry point" equivalente al `main()` Python: la composizione
e l'avvio avvengono nel modulo radice (`app.js`) che importa e inizializza gli altri.
I due template seguenti coprono i due pattern ricorrenti.

---

### 3.1 Modulo Utility (funzioni pure, nessun DOM)

`textProcessor.js` — espone funzioni riutilizzabili, importabile da altri moduli.

```javascript
/**
 * textProcessor.js - Elaborazione e validazione di dati testuali.
 *
 * Espone funzioni pure per validare, normalizzare e caricare testo
 * da risorse remote. Nessuna dipendenza dal DOM.
 *
 * @module  textProcessor
 * @version 1.0.0
 * @date    2026-02-16
 * @author  Team Sviluppo
 */

// Costanti private al modulo
const MAX_LINE_LENGTH = 500;


/**
 * Valida che una stringa non sia vuota o nulla.
 *
 * @param {string} value     - Valore da validare.
 * @param {string} fieldName - Nome del campo (per il log degli errori).
 * @returns {boolean} True se valido, false altrimenti.
 */
const validateString = function(value, fieldName) {
    if (value === null || value === undefined) {
        console.error(`validateString: ${fieldName} è null o undefined`);
        return false;
    }

    if (typeof value !== "string") {
        console.error(`validateString: ${fieldName} non è una stringa`);
        return false;
    }

    if (value.trim().length === 0) {
        console.error(`validateString: ${fieldName} è vuoto`);
        return false;
    }

    const isValid = true;
    return isValid;
};


/**
 * Normalizza una singola riga di testo (trim + maiuscolo).
 *
 * @param {string} line - Riga da processare.
 * @returns {string|null} Riga normalizzata, o null in caso di errore.
 */
const normalizeLine = function(line) {
    // Fail Fast
    if (!validateString(line, "line")) {
        return null;
    }

    if (line.length > MAX_LINE_LENGTH) {
        console.error(`normalizeLine: riga supera ${MAX_LINE_LENGTH} caratteri`);
        return null;
    }

    const trimmed = line.trim();
    const normalized = trimmed.toUpperCase();

    // Return Strict
    return normalized;
};


/**
 * Carica testo da una URL e lo restituisce come array di righe normalizzate.
 *
 * @param {string} url - URL della risorsa testuale.
 * @returns {Promise<string[]|null>} Righe normalizzate, o null in caso di errore.
 */
const loadLinesAsync = async function(url) {
    // Fail Fast
    if (!validateString(url, "url")) {
        return null;
    }

    let processedLines = null;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const statusCode = response.status;
            console.error(`loadLinesAsync: risposta non valida (${statusCode})`);
            return null;
        }

        const rawText = await response.text();
        const lines = rawText.split("\n");
        const results = [];

        for (const line of lines) {
            const normalized = normalizeLine(line);

            if (normalized !== null) {
                results.push(normalized);
            }
        }

        processedLines = results;

    } catch (error) {
        console.error("loadLinesAsync:", error);
        processedLines = null;
    }

    // Return Strict
    return processedLines;
};


// Export: solo le funzioni che altri moduli devono usare
export { validateString, loadLinesAsync };
```

---

### 3.2 Modulo con Stato DOM (Factory Pattern)

`userList.js` — gestisce un componente UI con stato interno. Importa dal modulo utility.

```javascript
/**
 * userList.js - Componente lista utenti.
 *
 * Gestisce il caricamento e la visualizzazione di una lista utenti
 * in un contenitore DOM. Usa il pattern factory per incapsulare lo stato.
 *
 * @module  userList
 * @version 1.0.0
 * @date    2026-02-16
 * @author  Team Sviluppo
 */

import { validateString, loadLinesAsync } from "./textProcessor.js";

// Costanti private al modulo
const CSS_CLASS_ITEM = "user-list__item";
const CSS_CLASS_EMPTY = "user-list--empty";


/**
 * Crea un'istanza del componente lista utenti.
 *
 * @param {string} containerId - ID dell'elemento DOM contenitore.
 * @returns {Object|null} API pubblica del componente, o null se il DOM non è pronto.
 */
const UaUserList = function(containerId) {

    // 1. STATO PRIVATO
    const _container = document.getElementById(containerId);
    let _items = [];

    // Fail Fast sul DOM
    if (!_container) {
        console.error(`UaUserList: elemento #${containerId} non trovato`);
        return null;
    }

    // 2. FUNZIONI PRIVATE

    /**
     * Crea un elemento <li> per un singolo utente.
     *
     * @param {string} label - Testo da visualizzare.
     * @returns {HTMLElement} Elemento DOM creato.
     */
    const _createItem = function(label) {
        const li = document.createElement("li");
        li.className = CSS_CLASS_ITEM;
        li.textContent = label;

        // Return Strict
        return li;
    };

    /**
     * Svuota e ridisegna l'intera lista nel DOM.
     */
    const _redraw = function() {
        _container.innerHTML = "";

        if (_items.length === 0) {
            _container.classList.add(CSS_CLASS_EMPTY);
            return;
        }

        _container.classList.remove(CSS_CLASS_EMPTY);

        for (const item of _items) {
            const li = _createItem(item);
            _container.appendChild(li);
        }
    };

    // 3. FUNZIONI PUBBLICHE

    /**
     * Carica gli elementi da una URL e aggiorna la lista.
     *
     * @param {string} url - URL della sorgente dati.
     * @returns {Promise<boolean>} True se il caricamento è avvenuto con successo.
     */
    const loadAsync = async function(url) {
        // Fail Fast
        if (!validateString(url, "url")) {
            return false;
        }

        const lines = await loadLinesAsync(url);

        if (lines === null) {
            console.error("UaUserList.loadAsync: caricamento fallito");
            return false;
        }

        _items = lines;
        _redraw();

        const success = true;
        return success;
    };

    /**
     * Restituisce il numero di elementi attualmente in lista.
     *
     * @returns {number} Numero di elementi.
     */
    const getCount = function() {
        const count = _items.length;
        return count;
    };

    // 4. API PUBBLICA
    const api = {
        loadAsync: loadAsync,
        getCount: getCount
    };
    return api;
};


export { UaUserList };
```

---

### 3.3 Modulo Radice (`app.js`)

Il modulo radice è l'unico punto di composizione e inizializzazione. Non contiene
logica di business: importa i moduli, li istanzia e li connette.

```javascript
/**
 * app.js - Punto di composizione dell'applicazione.
 *
 * Importa e inizializza i moduli. Non contiene logica di business.
 *
 * @module  app
 * @version 1.0.0
 * @date    2026-02-16
 * @author  Team Sviluppo
 */

import { UaUserList } from "./userList.js";

// Costanti di configurazione dell'app
const DATA_URL = "/api/users.txt";
const CONTAINER_ID = "user-list-container";


/**
 * Inizializza l'applicazione dopo il caricamento del DOM.
 */
const init = async function() {
    const userList = UaUserList(CONTAINER_ID);

    if (!userList) {
        console.error("app.init: impossibile inizializzare UaUserList");
        return;
    }

    const success = await userList.loadAsync(DATA_URL);

    if (success) {
        const itemCount = userList.getCount();
        console.log(`app.init: caricati ${itemCount} utenti`);
    }
};


// Punto di avvio: attende il DOM prima di inizializzare
document.addEventListener("DOMContentLoaded", init);
```

---

## 4. CHECKLIST DI AUTO-REVISIONE (MANDATORIA)

Prima di confermare la generazione del codice, verificare:

### Livello 1 - Fondamentali
- [ ] **Return Strict:** Ogni `return` è preceduto da assegnazione a variabile? (NO `return func()`)
- [ ] **Template Literal Strict:** Ogni `${}` contiene solo il nome di una variabile, senza operazioni o chiamate a funzioni?
- [ ] **Lingua:** Commenti e JSDoc in Italiano? Nomi in Inglese?
- [ ] **Header:** File contiene `"use strict"`, versione, data, autore e JSDoc del modulo?

### Livello 2 - Struttura
- [ ] **ES6 Modules:** Il file usa `import`/`export` invece di script globali?
- [ ] **Export Esplicito:** Solo le funzioni/factory effettivamente pubbliche sono esportate?
- [ ] **app.js come radice:** La composizione e l'inizializzazione sono in `app.js`, non nei singoli moduli?
- [ ] **Parametri Espliciti:** I parametri sono passati esplicitamente (no variabili globali)?
- [ ] **Fail Fast:** Ogni funzione valida gli input all'inizio?
- [ ] **Costanti:** Valori hardcoded sostituiti con costanti in `UPPER_CASE` dichiarate a livello di modulo?

### Livello 3 - JavaScript Specifico
- [ ] **Async/Await:** Usato `async/await` invece di `.then()`?
- [ ] **const/let:** Usato `const` di default, `let` solo se necessario, `var` mai?
- [ ] **Eccezioni:** Ogni `catch` logga l'errore con nome funzione e non lo silenzia?
- [ ] **result = null:** Variabile del risultato dichiarata prima del `try`, assegnata dentro, restituita dopo?
- [ ] **Factory Pattern:** Moduli con stato usano il pattern factory/closure?

### Livello 4 - Chiarezza
- [ ] **Concatenazioni:** Nessuna catena `.filter().map().reduce()` complessa su una riga?
- [ ] **Funzioni Lunghe:** Funzioni > 40 righe sono state divise?
- [ ] **JSDoc:** Ogni funzione pubblica ha JSDoc completa con `@param` e `@returns`?

### Livello 5 - Logging e Visibilità Errori
- [ ] **Prefisso Errori:** Ogni `console.error` include il nome della funzione come prefisso?
- [ ] **Errori Visibili:** Gli errori sono loggati, non silenziati?

---

## 5. ANTI-PATTERN DA EVITARE

### ❌ VIETATO

```javascript
// VIETATO: Script globale invece di ES Module
// <script src="app.js"></script>  senza type="module"
window.myModule = { ... };  // inquina il namespace globale

// VIETATO: Import dinamico non necessario
const { helper } = await import("./utils.js");  // usare static import in cima al file

// VIETATO: Return diretto senza variabile
const getData = async function() {
    return await fetchFromApi();
};

// VIETATO: Elaborazione dentro template literal
const message = `Risultato: ${value.trim().toUpperCase()}`;
const prompt = `Dati: ${JSON.stringify(records)}`;

// VIETATO: Promise chain invece di async/await
fetch(url)
    .then(r => r.json())
    .then(data => render(data));

// VIETATO: Catena di metodi complessa su una riga
return users.filter(u => u.active).map(u => u.name).join(", ");

// VIETATO: Ternario annidato
const x = a ? (b ? c : d) : e;

// VIETATO: var
var counter = 0;

// VIETATO: Magic numbers
setTimeout(fn, 5000);

// VIETATO: catch silenzioso
try {
    doSomething();
} catch (error) {}
```

### ✅ CORRETTO

```javascript
// CORRETTO: ES Module con type="module" in HTML
// <script type="module" src="app.js"></script>
// Ogni modulo esporta solo la propria API pubblica
export { validateString, loadLinesAsync };

// CORRETTO: Static import in cima al file
import { helper } from "./utils.js";

// CORRETTO: Return con variabile nominata
const getData = async function() {
    const data = await fetchFromApi();
    return data;
};

// CORRETTO: Template Literal Strict - preparare prima, interpolre poi
const valueClean = value.trim().toUpperCase();
const message = `Risultato: ${valueClean}`;

const recordsText = JSON.stringify(records, null, 2);
const prompt = `Dati: ${recordsText}`;

// CORRETTO: async/await
const response = await fetch(url);
const data = await response.json();
render(data);

// CORRETTO: Passaggi espliciti invece di catena
const activeUsers = users.filter(u => u.active);
const userNames = activeUsers.map(u => u.name);
const nameList = userNames.join(", ");
return nameList;

// CORRETTO: If esplicito invece di ternario annidato
let x = e;
if (a) {
    x = b ? c : d;
}

// CORRETTO: const/let
const counter = 0;

// CORRETTO: Costanti nominate
const TIMEOUT_MS = 5000;
setTimeout(fn, TIMEOUT_MS);

// CORRETTO: catch con logging
try {
    doSomething();
} catch (error) {
    console.error("myFunction:", error);
    result = null;
}
```

---

## 6. NOTE FINALI

- Queste regole sono **INDEROGABILI** per garantire consistenza e manutenibilità.
- In caso di dubbio, privilegiare sempre la **chiarezza** rispetto alla concisione.
- Il codice deve essere **auto-documentante**: i nomi devono spiegare lo scopo.
- Ogni violazione deve essere **esplicitamente giustificata** con un commento dettagliato.

**Ricorda:** "Il codice si scrive una volta, ma si legge molte volte."
