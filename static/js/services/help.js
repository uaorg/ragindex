/** @format */
"use strict";

/**
 * HTML per la finestra di aiuto dei comandi (Help).
 * Descrive le funzionalità dell'interfaccia e dei pulsanti principali.
 */
export const help0_html = `
<div class="text">
    <p class="center">Interfaccia e Supporto</p>
    <div>
        <strong>HelpPopup (Grigio)</strong>
        <p>Passando il mouse sui pulsanti d'azione (1, 2, 3), sull'upload o sui cestini, apparirà una finestra descrittiva grigio scuro con dettagli sul funzionamento.</p>
    </div>
    <div>
        <strong>Tooltip Dinamici</strong>
        <p>Il pulsante Log e l'icona del Menu cambiano il loro suggerimento testuale (Open/Close) in base allo stato attuale del pannello.</p>
    </div>
    <hr>
    <!-- Barra Superiore -->
    <p class="center">Barra Superiore</p>
    <div>
        <strong>Menu Laterale (icona hamburger)</strong>
        <p>Apre e chiude il menu laterale con i comandi principali.</p>
    </div>
    <div>
        <strong>? (Help)</strong>
        <p>Mostra questa finestra con la descrizione dei comandi.</p>
    </div>
    <div>
        <strong>Upload file</strong>
        <p>Apre la finestra per caricare uno o più documenti (PDF, DOCX, TXT) dal tuo computer.</p>
    </div>
    <div>
        <strong>LLM (Provider/Modello)</strong>
        <p>Apre il menu per scegliere il provider AI (es. Gemini, Mistral) e il modello specifico da usare.</p>
    </div>
    <div>
        <strong>Log</strong>
        <p>Attiva o disattiva la finestra di log, utile per vedere le fasi del processo RAG in tempo reale.</p>
    </div>
    <div>
        <strong>Tema (Sole/Luna)</strong>
        <p>Passa dal tema scuro a quello chiaro.</p>
    </div>

    <hr>

    <!-- Comandi Finestra di Output -->
    <p class="center">Comandi Finestra di Output (in alto a destra)</p>
    <div>
        <strong>Copia Output</strong>
        <p>Il pulsante in alto a destra copia l'intero contenuto della finestra di output negli appunti.</p>
    </div>

    <div>
        <strong>Nuova Conversazione (Giallo)</strong>
        <p>Il pulsante giallo cancella la cronologia della conversazione attiva. Mantiene il Contesto attuale per permettere di ricominciare a parlare degli stessi argomenti.</p>
    </div>
    <div>
        <strong>Nuovo Contesto & Conversazione (Rosso)</strong>
        <p>Il pulsante rosso resetta completamente la sessione di lavoro: cancella il Contesto estratto e la cronologia della conversazione attiva.</p>
    </div>

    <hr>

    <!-- Pulsanti del Flusso RAG -->
    <p class="center">Pulsanti d'Azione (a destra dell'input)</p>
    <div>
        <strong>(1) Crea Knowledge Base (Rosso)</strong>
        <p>Il pulsante rosso in alto nella colonna di input analizza i documenti caricati e crea l'indice di ricerca.</p>
    </div>
    <div>
        <strong>(2) Inizia Conversazione (Giallo)</strong>
        <p>Il pulsante giallo centrale usa la domanda per cercare nella KB e avvia il dialogo con l'LLM.</p>
    </div>
    <div>
        <strong>(3) Continua Conversazione (Verde)</strong>
        <p>Il pulsante verde alla base della colonna prosegue il dialogo basandosi sulla storia precedente.</p>
    </div>
    <div>
        <strong>Controlli Contestuali</strong>
        <p>I pulsanti a destra della textarea (ingranditi per una facile selezione) permettono di cancellare l'input o ripristinare l'ultima domanda.</p>
    </div>
    <hr>

    <!-- Menu Laterale -->
    <p class="center">Menu Laterale</p>
    <div>
        <strong>Informazioni</strong>
        <ul>
            <li><strong>README:</strong> Approfondimento tecnico sul funzionamento del sistema.</li>
            <li><strong>Quick Start:</strong> Guida rapida ai 3 passi fondamentali.</li>
        </ul>
    </div>
    <div>
        <strong>Knowledge Base</strong>
        <ul>
            <li><strong>Archivia:</strong> Salva la KB corrente con un nome personalizzato (gli spazi verranno convertiti in underscore internamente).</li>
            <li><strong>Gestisci:</strong> Elenco delle KB salvate per caricamento, eliminazione o <strong>Backup (Export JSON)</strong>. I nomi vengono mostrati senza underscore per una migliore leggibilità.</li>
            <li><strong>Ripristina:</strong> Carica una KB da file JSON. Una volta scelto il nome, la KB viene <strong>attivata automaticamente</strong> aggiornando l'intestazione superiore.</li>
        </ul>
    </div>
    <div>
        <strong>Conversazione</strong>
        <ul>
            <li><strong>Visualizza:</strong> Mostra la cronologia testuale del dialogo corrente.</li>
            <li><strong>Archivia:</strong> Salva la sessione attiva (Contesto + Cronologia).</li>
            <li><strong>Gestisci:</strong> Elenco delle conversazioni salvate con opzioni di <strong>Backup (Export JSON)</strong>.</li>
            <li><strong>Ripristina:</strong> Carica una conversazione da file JSON con <strong>attivazione automatica immediata</strong>.</li>
            <li><strong>Visualizza Contesto:</strong> Mostra i frammenti di testo estratti dalla KB che l'AI sta usando per rispondere.</li>
        </ul>
    </div>
    <div>
        <strong>Gestione Dati</strong>
        <ul>
            <li><strong>Elenco Documenti:</strong> Gestione dei file caricati in memoria.</li>
            <li><strong>Elenco Dati Archiviati:</strong> Panoramica tecnica di tutte le chiavi e dimensioni dei dati salvati in IndexedDB e LocalStorage.</li>
            <li><strong>Cancella Dati:</strong> Reset totale dello storage del browser.</li>
        </ul>
    </div>
    <div>
        <strong>Gestione API Key</strong>
        <ul>
            <li><strong>Privacy e Sicurezza:</strong> Le tue chiavi API sono memorizzate esclusivamente nel database <strong>IndexedDB</strong> del tuo browser.</li>
            <li><strong>Multi-Key Support:</strong> Puoi salvare più chiavi e passare dall'una all'altra istantaneamente.</li>
        </ul>
    </div>
    <div>
        <strong>Documenti Esempio:</strong> Carica rapidamente testi predefiniti per testare il sistema.
    </div>
    <div>
        <strong>Logout:</strong> Termina la sessione utente e torna alla pagina di login.
    </div>
</div>
`;


/**
 * HTML per il README tecnico.
 * Spiega la filosofia del progetto, l'architettura e l'uso di BM25.
 */
export const help1_html = `
<div class="text">
    <p class="center" style="font-size: 1.2em; font-weight: bold;">RagIndex: RAG 100% Client-Side</p>
    <p>
        <strong>RagIndex</strong> è un'applicazione web che implementa un'architettura RAG (Retrieval-Augmented Generation) completa, operando interamente nel browser dell'utente. Nessun dato viene inviato a un server, garantendo massima privacy e autonomia.
    </p>

    <hr>

    <div>
        <strong>🚀 Obiettivi del Progetto</strong>
        <ul>
            <li><strong>Privacy Assoluta:</strong> Tutta l'elaborazione dei documenti, dall'indicizzazione alla costruzione del contesto, avviene localmente. I documenti non lasciano mai il computer dell'utente.</li>
            <li><strong>Zero Backend:</strong> L'applicazione è un puro front-end che sfrutta le API degli LLM direttamente dal client.</li>
            <li><strong>Efficienza:</strong> Sfrutta un indice di ricerca lessicale (Lunr.js con BM25) ottimizzato per il browser.</li>
            <li><strong>Portabilità:</strong> Funzioni di Backup/Restore per spostare KB e chat tra diversi dispositivi via JSON.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>🏗️ Architettura del Sistema</strong>
        <p>L'architettura separa le operazioni UI da quelle intensive (eseguite in Web Worker) e utilizza <strong>IndexedDB</strong> per la persistenza.</p>
        <ol>
            <li><strong>Presentation Layer:</strong> Interfaccia reattiva basata su LESS.</li>
            <li><strong>Business Logic:</strong> <code>rag_engine.js</code> coordina il flusso RAG.</li>
            <li><strong>Background Processing:</strong> <code>rag_worker.js</code> gestisce chunking e indicizzazione senza bloccare la UI.</li>
            <li><strong>Service Layer:</strong> Astrazione per DB (Dexie.js), Parser (Marked.js) e LLM Client.</li>
        </ol>
    </div>

    <div>
        <strong>🧠 Innovazione: Chunking Parent-Child</strong>
        <p>RagIndex utilizza una segmentazione gerarchica per bilanciare precisione e contesto:</p>
        <ul>
            <li><strong>Parent Chunks:</strong> Unità di contesto (paragrafi completi) inviate all'LLM per la risposta.</li>
            <li><strong>Child Chunks:</strong> Unità di ricerca (singole frasi) indicizzate per una ricerca granulare e precisa.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>🔍 Un Paradigma Alternativo: La Scelta Lessicale (BM25)</strong>
        <p>
            A differenza del RAG standard basato su <em>embeddings</em> semantici, RagIndex utilizza la <strong>ricerca lessicale BM25</strong>.
        </p>
        <ul>
            <li><strong>Perché BM25?</strong> È estremamente leggero per il browser, non richiede modelli vettoriali pesanti e offre una precisione chirurgica su termini tecnici, nomi e codici.</li>
            <li><strong>Privacy:</strong> L'indicizzazione avviene istantaneamente sul tuo dispositivo senza inviare testi a servizi di embedding esterni.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>🤖 Supporto Multi-Provider</strong>
        <p>RagIndex supporta i principali modelli allo stato dell'arte:</p>
        <ul>
            <li><strong>Google Gemini:</strong> Modelli Flash e Pro (2.5, 3.0).</li>
            <li><strong>Mistral:</strong> Large, Medium, Small e la serie Pixtral/Ministral.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>⚙️ Setup e Privacy</strong>
        <p>
            Le tue <strong>API Key</strong> sono salvate esclusivamente nell'IndexedDB del tuo browser. La comunicazione AI avviene direttamente dal tuo computer al provider, senza server intermedi. Il sistema è puramente statico e può essere eseguito con qualsiasi semplice web server locale.
        </p>
    </div>
</div>
`;




/**
 * HTML per il QuickStart.
 * Guida l'utente attraverso il flusso operativo 1-2-3.
 */
export const help2_html = `
<div class="text">
    <p class="center">Guida Rapida: Il Flusso di Lavoro in 3 Azioni</p>
    <p>
        RagIndex segue un flusso lineare e intuitivo basato su tre fasi numerate. Ecco come procedere:
    </p>

    <div class="step">
        <strong style="color: #e82323;">(1) Fase 1: Creazione Knowledge Base (Rosso)</strong>
        <p>In questa fase il sistema analizza i tuoi documenti e crea l'indice di ricerca.</p>
        <ul>
            <li><strong>Input:</strong> Carica i file (PDF, TXT, DOCX) con l'icona <strong>Nuvola</strong>.</li>
            <li><strong>Azione:</strong> Clicca il pulsante rosso <span style="font-weight: bold;">(1)</span>.</li>
            <li><strong>Ripristino:</strong> Puoi anche usare <strong>Menu > KB > Ripristina</strong> per caricare una base dati salvata in precedenza.</li>
        </ul>
    </div>

    <hr>

    <div class="step">
        <strong style="color: #f6e602;">(2) Fase 2: Inizia Conversazione (Giallo)</strong>
        <p>In questa fase il sistema estrae il contesto pertinente alla tua domanda.</p>
        <ul>
            <li><strong>Input:</strong> Scrivi la tua domanda nel campo di testo.</li>
            <li><strong>Azione:</strong> Clicca il pulsante giallo centrale <span style="font-weight: bold;">(2)</span> (o premi Invio).</li>
            <li><strong>Ripristino:</strong> Puoi riprendere una vecchia chat da <strong>Menu > Conversazione > Ripristina</strong>.</li>
        </ul>
    </div>

    <hr>

    <div class="step">
        <strong style="color: #00bd97;">(3) Fase 3: Continua Conversazione (Verde)</strong>
        <p>In questa fase puoi approfondire l'argomento senza perdere il filo del discorso.</p>
        <ul>
            <li><strong>Input:</strong> Scrivi nuove domande di approfondimento.</li>
            <li><strong>Azione:</strong> Clicca il pulsante verde alla base <span style="font-weight: bold;">(3)</span>.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>Nota Importante sulla Privacy</strong>
        <p>Le tue API Key e i tuoi dati sono salvati esclusivamente nel tuo browser (IndexedDB). Nessun dato viene inviato a terze parti eccetto i prompt inviati direttamente al provider AI scelto.</p>
    </div>
</div>
`;