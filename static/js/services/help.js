/** @format */
"use strict";

/**
 * HTML per la finestra di aiuto dei comandi (Help).
 * Descrive l'architettura, la logica di funzionamento e l'interfaccia.
 */
export const help0_html = `
<div class="text">
    <p class="center" style="font-size: 1.2em; font-weight: bold;">Elenco Comandi RagIndex</p>

    <p class="center" style="font-style: italic; margin-bottom: 12px;">
        Passa il mouse su ogni comando per un aiuto contestuale.
    </p>

    <div>
        <strong style="font-size: 1.1em;">Barra Superiore (Header)</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Icona Menu</strong> <span>Apre il menu laterale con tutte le sezioni (KB, Chat, Dati, API Key, Logout).</span>
            <strong>? (Help)</strong> <span>Apre questa finestra con l'elenco completo dei comandi.</span>
            <strong>Upload</strong> <span>Carica file PDF, DOCX o TXT nella Knowledge Base.</span>
            <strong>LLM</strong> <span>Sceglie il provider AI (Gemini, Mistral, OpenRouter, ecc.) e il modello.</span>
            <strong>Log</strong> <span>Mostra la console tecnica con i messaggi di chunking, ricerca ed errori.</span>
            <strong>Tema</strong> <span>Alterna tra tema scuro e tema chiaro.</span>
        </div>
    </div>

    <hr>

    <div>
        <strong style="font-size: 1.1em;">Pulsanti di Controllo</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Cancella Input</strong> <span>Elimina il testo nella casella di input.</span>
            <strong>Copia Output</strong> <span>Copia la risposta dell'AI negli appunti.</span>
            <strong>Avvia (Giallo)</strong> <span>Cerca il contesto nei documenti e invia la prima domanda all'AI.</span>
            <strong>Continua (Verde)</strong> <span>Invia una nuova domanda mantenendo chat e contesto.</span>
        </div>
    </div>

    <hr>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; Informazioni</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Quick Start</strong> <span>Guida operativa rapida su pipeline, memoria e comandi del menu.</span>
        </div>
    </div>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; Knowledge Base</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Crea</strong> <span>Genera l'indice di ricerca Lunr BM25 dai documenti caricati.</span>
            <strong>Cancella</strong> <span>Elimina la Knowledge Base attiva e i suoi indici.</span>
            <strong>Archivia</strong> <span>Salva la KB corrente con un nome personalizzato per usi futuri.</span>
            <strong>Gestisci</strong> <span>Elenca, attiva, esporta o elimina le KB archiviate.</span>
            <strong>Ripristina</strong> <span>Carica una KB da un file di backup JSON.</span>
        </div>
    </div>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; Conversazione</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Visualizza Contesto</strong> <span>Mostra il contenuto estratto usato dall'AI per rispondere.</span>
            <strong>Visualizza Conversazione</strong> <span>Mostra l'intero storico della chat in formato testo.</span>
            <strong>Cancella Contesto</strong> <span>Azzera contesto, prima domanda e tutta la conversazione.</span>
            <strong>Cancella Conversazione</strong> <span>Elimina solo i messaggi successivi alla prima domanda.</span>
            <strong>Archivia</strong> <span>Salva la cronologia della chat corrente con un nome personalizzato.</span>
            <strong>Gestisci</strong> <span>Elenca, attiva, esporta o elimina le conversazioni archiviate.</span>
            <strong>Ripristina</strong> <span>Carica una conversazione da un file di backup JSON.</span>
        </div>
    </div>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; Gestione Dati</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>Elenco Documenti</strong> <span>Mostra i file caricati con opzioni di visualizzazione ed eliminazione.</span>
            <strong>Dati Archiviati</strong> <span>Mostra tutti i dati in IndexedDB: chunk, indici, contesto e thread.</span>
            <strong>Reset</strong> <span>Cancella ogni dato: KB, contesto, conversazioni, documenti e chiavi.</span>
        </div>
    </div>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; API Key</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 12px 0; font-size: 0.95em;">
            <strong>API Keys Default</strong> <span>Ripristina le chiavi API predefinite dal file api_x.json.</span>
            <strong>Gestisci API Key</strong> <span>Aggiungi, attiva o elimina le tue chiavi API personali.</span>
        </div>
    </div>

    <div>
        <strong style="font-size: 1.1em;">Menu Laterale &mdash; Sistema</strong>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 6px; margin: 6px 0 0 0; font-size: 0.95em;">
            <strong>Logout</strong> <span>Esci dall'applicazione e torna alla schermata di login.</span>
        </div>
    </div>
</div>
`;


/**
 * HTML per il QuickStart.
 * Guida sintetica al workflow: upload -> KB -> conversazione.
 */
export const help2_html = `
<div class="text">
    <p class="center" style="font-size: 1.2em; font-weight: bold;">Guida Rapida</p>
    
    <div>
        <strong style="color: #f6e602;">Workflow</strong>
        <ol>
            <li><strong>Carica</strong> i documenti (PDF, DOCX, TXT) con il pulsante Upload nell'header.</li>
            <li><strong>Crea KB</strong> dal menu laterale (Knowledge Base &gt; Crea) per indicizzare i documenti.</li>
            <li><strong>Avvia Conversazione</strong> (pulsante giallo): estrae il contesto e interroga l'AI.</li>
            <li><strong>Continua Dialogo</strong> (pulsante verde): prosegui la chat senza perdere il contesto.</li>
        </ol>
    </div>
</div>
`;
