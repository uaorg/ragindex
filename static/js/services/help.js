/** @format */
"use strict";

/**
 * HTML per la finestra di aiuto dei comandi (Help).
 * Descrive l'architettura, la logica di funzionamento e l'interfaccia.
 */
export const help0_html = `
<div class="text">
    <p class="center" style="font-size: 1.2em; font-weight: bold;">Architettura e Logica RagIndex</p>
    
    <div>
        <strong>Privacy e Logica 100% Client-Side</strong>
        <p>RagIndex opera interamente nel tuo browser. L'ingestione dei documenti, il chunking, l'indicizzazione e la ricerca del contesto avvengono localmente. I tuoi file non vengono mai inviati a un server; solo il prompt finale (domanda + contesto estratto) viene inviato al provider AI scelto.</p>
    </div>

    <div>
        <strong>Generazione del Contesto (La Chiave del RAG)</strong>
        <p>Il cuore del sistema è la <strong>generazione del contesto</strong>: quando poni la prima domanda (Azione 2), il sistema cerca nella Knowledge Base i frammenti di testo più rilevanti. Questi frammenti vengono "iniettati" nella memoria dell'AI, permettendole di rispondere basandosi sui <em>tuoi</em> documenti invece che solo sulle sue conoscenze generali.</p>
    </div>

    <hr>

    <p class="center">Interfaccia e Feedback</p>
    <div>
        <strong>HelpPopup (Tooltip Grigio)</strong>
        <p>Passando il mouse sui pulsanti d'azione (1, 2, 3), sui comandi della cronologia o sulla gestione API, apparirà una finestra descrittiva con dettagli specifici.</p>
    </div>
    <div>
        <strong>Indicatori di Stato</strong>
        <p>In alto a sinistra è sempre visibile la <strong>KB attiva</strong>. Se leggi "BASE CORRENTE", significa che stai usando i documenti appena indicizzati ma non ancora archiviati con un nome specifico.</p>
    </div>

    <hr>

    <p class="center">Barra Superiore (Header)</p>
    <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin-bottom: 10px;">
        <strong>Icona Menu</strong> <span>Apre il pannello laterale per la gestione avanzata di KB, Chat e API Key.</span>
        <strong>? (Help)</strong> <span>Mostra questa documentazione.</span>
        <strong>Nuvola</strong> <span>Upload di file (PDF, DOCX, TXT) per la Knowledge Base.</span>
        <strong>LLM</strong> <span>Configurazione Provider (Gemini, Mistral, OpenRouter) e scelta del modello.</span>
        <strong>Log</strong> <span>Apre la console tecnica per monitorare le fasi di chunking e ricerca.</span>
        <strong>Sole/Luna</strong> <span>Cambia il tema visivo (Chiaro/Scuro).</span>
    </div>

    <hr>

    <p class="center">Controlli Output e Sessione</p>
    <div>
        <strong>Copia (Icona fogli)</strong> <span>Copia l'intero contenuto della finestra di output.</span>
    </div>
    <div>
        <strong>Nuova Conversazione (Giallo)</strong>
        <p>Cancella la storia della chat ma <strong>mantiene il contesto</strong> estratto. Utile per fare una nuova domanda sugli stessi documenti senza "confondere" l'AI con i messaggi precedenti.</p>
    </div>
    <div>
        <strong>Reset Totale (Rosso)</strong>
        <p>Pulisce sia la chat che il contesto. È il comando da usare quando vuoi cambiare completamente argomento o caricare una nuova KB.</p>
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
        <strong>RagIndex</strong> è un'applicazione web che implementa un'architettura RAG (Retrieval-Augmented Generation) completa, operando interamente nel browser dell'utente.
    </p>

    <hr>

    <div>
        <strong>🚀 Obiettivi del Progetto</strong>
        <ul>
            <li><strong>Privacy Assoluta:</strong> Tutta l'elaborazione avviene localmente via Web Worker.</li>
            <li><strong>Zero Backend:</strong> Sfrutta la potenza del browser (IndexedDB) e API LLM dirette.</li>
            <li><strong>Efficienza:</strong> Utilizza <strong>Lunr.js</strong> con algoritmo <strong>BM25</strong> per ricerche lessicali ultra-rapide e precise su nomi tecnici e codici.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>🧠 Innovazione: Chunking Parent-Child</strong>
        <p>RagIndex bilancia precisione e ricchezza di informazioni:</p>
        <ul>
            <li><strong>Child Chunks (Ricerca):</strong> Piccoli segmenti (frasi) indicizzati per trovare esattamente il punto rilevante.</li>
            <li><strong>Parent Chunks (Contesto):</strong> Blocchi più ampi (paragrafi) che vengono inviati all'AI per fornire il senso completo dell'informazione trovata.</li>
        </ul>
    </div>

    <hr>

    <div>
        <strong>⚙️ Persistenza e Sicurezza</strong>
        <p>
            Le <strong>API Key</strong> e i documenti sono salvati in <strong>IndexedDB</strong>, un database interno al tuo browser. I dati non scadono alla chiusura della scheda, ma possono essere cancellati tramite le impostazioni di pulizia del browser o il comando "Cancella Dati" nel menu.
        </p>
    </div>
</div>
`;




/**
 * HTML per il QuickStart e Dettaglio Comandi.
 * Spiega il flusso pipeline e la gestione della memoria.
 */
export const help2_html = `
<div class="text">
    <p class="center" style="font-size: 1.2em; font-weight: bold;">Guida Operativa: Pipeline e Memoria</p>
    
    <div class="step">
        <strong style="color: #e82323;">(1) Creazione Knowledge Base (Azione Rossa)</strong>
        <p>Analizza i file caricati, esegue il chunking e crea l'indice di ricerca Lunr.</p>
        <p><em>Nota:</em> Se carichi nuovi file dopo aver creato la KB, devi rieseguire questo passaggio per includerli nell'indice.</p>
    </div>

    <div class="step">
        <strong style="color: #f6e602;">(2) Inizio Conversazione (Azione Gialla)</strong>
        <p>È il momento cruciale: il sistema usa la tua domanda per <strong>estrarre il contesto</strong> dalla KB e invia il primo messaggio all'AI.</p>
        <p><em>Effetto:</em> Crea una "memoria di lavoro" che l'AI userà per tutta la conversazione.</p>
    </div>

    <div class="step">
        <strong style="color: #00bd97;">(3) Continua Dialogo (Azione Verde)</strong>
        <p>Invia nuove domande mantenendo sia la storia della chat che il contesto estratto inizialmente.</p>
    </div>

    <hr>

    <p class="center">Gestione Memoria e Archiviazione</p>
    <div>
        <strong>1. Memoria del Browser (IndexedDB)</strong>
        <p>Quando usi i comandi <strong>Archivia</strong> nel Menu (per KB o Conversazioni), i dati vengono salvati permanentemente nel database interno del browser.</p>
        <ul>
            <li><strong>KB > Gestisci:</strong> Permette di riattivare istantaneamente una vecchia base dati indicizzata.</li>
            <li><strong>Chat > Gestisci:</strong> Permette di riprendere una conversazione passata caricando anche il contesto originale.</li>
        </ul>
    </div>

    <div>
        <strong>2. Memoria Locale (Backup su PC)</strong>
        <p>Per una sicurezza extra o per spostare i dati su un altro computer, usa il <strong>Backup (Export JSON)</strong> presente nelle finestre di gestione.</p>
        <ul>
            <li><strong>Esportazione:</strong> Scarica un file .json sul tuo PC.</li>
            <li><strong>Ripristino:</strong> Carica il file .json tramite il comando <strong>Ripristina</strong> nel menu per reinserirlo nel database del browser.</li>
        </ul>
    </div>

    <hr>

    <p class="center">Comandi del Menu Laterale</p>
    <div style="font-size: 0.9em;">
        <strong>Informazioni:</strong> Leggi il README tecnico o questo Quick Start.<br>
        <strong>Knowledge Base:</strong> Archivia la KB corrente, gestisci le salvate o importa da file.<br>
        <strong>Conversazione:</strong> Esporta la chat, visualizza il testo puro o <strong>Vedi Contesto</strong> (per vedere cosa "legge" l'AI).<br>
        <strong>Gestione Dati:</strong> Controlla i documenti caricati o esegui un reset totale dello storage.<br>
        <strong>API Key:</strong> Gestisci le chiavi per i diversi provider (Gemini, Mistral, ecc).
    </div>
</div>
`;