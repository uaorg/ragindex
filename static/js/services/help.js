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
        <p>Il cuore del sistema è la <strong>generazione del contesto</strong>: quando premi <strong>Avvia Conversazione</strong>, il sistema cerca nella Knowledge Base i frammenti di testo pi&ugrave; rilevanti. Questi frammenti vengono "iniettati" nella memoria dell'AI, permettendole di rispondere basandosi sui <em>tuoi</em> documenti invece che solo sulle sue conoscenze generali.</p>
    </div>

    <hr>

    <p class="center">Interfaccia e Feedback</p>
    <div>
        <strong>HelpPopup</strong>
        <p>Passando il mouse sui pulsanti d'azione o sulle voci del menu laterale appare una finestra descrittiva con dettagli specifici sul comando.</p>
    </div>
    <div>
        <strong>Indicatori di Stato</strong>
        <p>In alto a sinistra sono sempre visibili la <strong>KB attiva</strong> e il <strong>modello LLM</strong> in uso. Se la KB mostra "BASE CORRENTE", significa che stai usando i documenti appena indicizzati ma non ancora archiviati con un nome specifico.</p>
    </div>

    <hr>

    <p class="center">Barra Superiore (Header)</p>
    <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; margin-bottom: 10px;">
        <strong>Icona Menu</strong> <span>Apre il pannello laterale per la gestione di KB, Conversazioni, API Key e dati.</span>
        <strong>? (Help)</strong> <span>Mostra questa documentazione.</span>
        <strong>Upload</strong> <span>Carica file PDF, DOCX o TXT per la Knowledge Base.</span>
        <strong>LLM</strong> <span>Configura il provider AI (Gemini, Mistral, OpenRouter, ecc.) e scegli il modello.</span>
        <strong>Log</strong> <span>Apre la console tecnica per monitorare chunking e ricerca.</span>
        <strong>Tema</strong> <span>Alterna tra tema scuro e tema chiaro.</span>
    </div>

    <hr>

    <p class="center">Pulsanti di Controllo</p>
    <div>
        <strong>Cancella Input</strong> <span>Elimina il testo scritto nella casella di input.</span>
    </div>
    <div>
        <strong>Copia Output</strong> <span>Copia il contenuto della finestra di risposta negli appunti.</span>
    </div>
    <div>
        <strong>Avvia Conversazione (Giallo)</strong>
        <p>Cerca il contesto nei documenti della KB e invia la prima domanda all'AI. Crea una nuova "memoria di lavoro".</p>
    </div>
    <div>
        <strong>Continua Dialogo (Verde)</strong>
        <p>Invia la nuova domanda mantenendo la cronologia della chat e il contesto gi&agrave; estratto.</p>
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
    
    <div>
        <strong style="color: #f6e602;">Flusso di Lavoro</strong>
        <ol>
            <li><strong>Carica</strong> documenti (PDF, DOCX, TXT) tramite il pulsante Upload nell'header.</li>
            <li><strong>Crea KB</strong> dal menu laterale: analizza i file, esegue il chunking e crea l'indice Lunr BM25. Necessario dopo ogni caricamento.</li>
            <li><strong>Avvia Conversazione</strong> (pulsante giallo): estrae il contesto dai documenti e interroga l'AI per la prima risposta.</li>
            <li><strong>Continua Dialogo</strong> (pulsante verde): prosegui la chat mantenendo la memoria della conversazione.</li>
        </ol>
    </div>

    <hr>

    <p class="center">Gestione Memoria e Archiviazione</p>
    <div>
        <strong>1. Memoria del Browser (IndexedDB)</strong>
        <p>I comandi <strong>Archivia</strong> nel menu salvano KB e Conversazioni nel database interno del browser.</p>
        <ul>
            <li><strong>KB &gt; Gestisci:</strong> Riattiva una Knowledge Base archiviata.</li>
            <li><strong>Chat &gt; Gestisci:</strong> Riprende una conversazione passata con il contesto originale.</li>
        </ul>
    </div>

    <div>
        <strong>2. Backup su File (Export JSON)</strong>
        <p>Per sicurezza o per spostare i dati su un altro computer, usa le finestre di gestione:</p>
        <ul>
            <li><strong>Esporta:</strong> Scarica un file .json sul PC.</li>
            <li><strong>Ripristina:</strong> Carica il file .json tramite il menu per reinserirlo in IndexedDB.</li>
        </ul>
    </div>

    <hr>

    <p class="center">Comandi del Menu Laterale</p>
    <div style="font-size: 0.9em;">
        <strong>Informazioni:</strong> Questo Quick Start.<br>
        <strong>Knowledge Base:</strong> Crea, Cancella, Archivia, Gestisci o Ripristina una KB.<br>
        <strong>Conversazione:</strong> Visualizza Contesto (cosa "legge" l'AI), Visualizza Cronologia, Cancella Contesto, Cancella solo i messaggi, Archivia, Gestisci o Ripristina.<br>
        <strong>Gestione Dati:</strong> Elenca i documenti caricati, i dati in IndexedDB o esegui un <strong>Reset</strong> totale.<br>
        <strong>API Key:</strong> Ripristina le chiavi predefinite o aggiungi/gestisci chiavi personali.
    </div>
</div>
`;
