/**
 * app_ui.js - Interfaccia utente e gestione comandi.
 *
 * Gestisce l'interazione con il DOM, la creazione di finestre modali,
 * il sistema di comandi e l'aggiornamento dinamico della UI.
 *
 * @module  app_ui
 * @version 1.1.3
 * @date    2026-05-01
 * @author  Gemini CLI
 */

"use strict";

import { UaWindowAdm } from "./services/uawindow.js";
import { UaJtfh } from "./services/uajtfh.js";
import { UaLog } from "./services/ualog3.js";
import { help0_html, help1_html, help2_html } from "./services/help.js";
import { documentUploader } from "./uploader.js";
import { AppMgr } from "./app_mgr.js";
import { UaDb } from "./services/uadb.js";
import { DocsMgr } from "./docs_mgr.js";
import { LlmProvider } from "./llm_provider.js";
import { textFormatter, messages2html, messages2text } from "./services/history_utils.js";
import { ragEngine } from "./rag_engine.js";
import { DATA_KEYS, getDescriptionForKey } from "./services/data_keys.js";
import { idbMgr } from "./services/idb_mgr.js";
import { requestGet } from "./services/http_request.js";
import { cleanDoc } from "./services/text_cleaner.js";
import { addApiKey } from "./services/key_retriever.js";
import { UaSender } from "./services/sender.js";
import { WebId } from "./services/webuser_id.js";

// ============================================================================
// COSTANTI DI MODULO
// ============================================================================

const CSS_SPINNER_BG = "spinner-bg";
const CSS_SHOW_SPINNER = "show-spinner";
const CSS_MENU_OPEN = "menu-open";


// ============================================================================
// STATO DEL MODULO
// ============================================================================

/** @type {string} Stato della knowledge base attiva. */
export let activeKbState = "Nessuna KB attiva";


// ============================================================================
// COMPONENTE SPINNER
// ============================================================================

/**
 * Gestore dell'indicatore di caricamento (Spinner).
 */
const _Spinner = (function() {
    
    const _getElements = function() {
        const els = {
            outputArea: document.querySelector("#id-text-out .div-text"),
            spinner: document.getElementById("spinner")
        };
        return els;
    };

    const stopAsync = async function() {
        const confirmed = await confirm("Confermi Cancellazione Richiesta?");
        if (confirmed) {
            const client = AppMgr.getClientLLM();
            if (client && typeof client.cancelRequest === "function") {
                client.cancelRequest();
            }
            ragEngine.stop();
            hide();
        }
    };

    const show = function() {
        const { outputArea, spinner } = _getElements();
        
        // Rimosso l'oscuramento dell'area di output per mantenere la visibilità della cronologia
        /*
        if (outputArea) {
            outputArea.classList.add(CSS_SPINNER_BG);
        }
        */

        if (spinner) {
            spinner.classList.add(CSS_SHOW_SPINNER);
            spinner.addEventListener("click", stopAsync);
        }
    };

    const hide = function() {
        const { outputArea, spinner } = _getElements();
        
        if (outputArea) {
            outputArea.classList.remove(CSS_SPINNER_BG);
        }

        if (spinner) {
            spinner.classList.remove(CSS_SHOW_SPINNER);
            spinner.removeEventListener("click", stopAsync);
        }
    };

    return {
        show: show,
        hide: hide
    };
})();


// ============================================================================
// FACTORY FINESTRE
// ============================================================================

/**
 * Factory base per finestre con pulsante copia e chiusura.
 *
 * @param {string} id - ID del contenitore finestra.
 * @param {string} contentClass - Classe CSS del contenitore contenuto (div-text o pre-text).
 * @param {string} copyMethodName - Nome del metodo di copia globale.
 * @returns {Object} API della finestra.
 */
const _UaWindowFactory = function(id, contentClass, copyMethodName) {
    const _win = UaWindowAdm.create(id);

    const close = function() {
        _win.close();
    };

    const copyAsync = async function() {
        const selector = `.${contentClass}`;
        const element = _win.getElement().querySelector(selector);
        
        if (!element) {
            return;
        }
        
        const text = element.textContent;
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error(`_UaWindowFactory.copyAsync (${id}):`, err);
        }
    };

    const show = function(content, delAll = true) {
        if (delAll) {
            wnds.closeAll();
        }

        _win.drag().setZ(12);

        const isMenuOpen = document.body.classList.contains(CSS_MENU_OPEN);
        const xPos = isMenuOpen ? 21 : 1;
        _win.vw_vh().setXY(xPos, 5, 1);

        const html = `
            <div class="window-text">
                <div class="btn-wrapper">
                    <button class="btn-copy wcp tt-left" data-tt="Copia" onclick="wnds.${copyMethodName}.copy()">
                        <svg class="copy-icon" viewBox="0 0 20 24">
                            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
                        </svg>
                    </button>
                    <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.${copyMethodName}.close()">X</button>
                </div>
                <${contentClass === "pre-text" ? "pre" : "div"} class="${contentClass}">${content}</${contentClass === "pre-text" ? "pre" : "div"}>
            </div>
        `;

        _win.setHtml(html);
        _win.show();
    };

    return {
        show: show,
        close: close,
        copy: copyAsync
    };
};

/**
 * Factory specifica per finestre informative (Info).
 *
 * @param {string} id - ID del contenitore finestra.
 * @returns {Object} API della finestra.
 */
const _UaWindowInfoFactory = function(id) {
    const _win = UaWindowAdm.create(id);

    const close = function() {
        _win.close();
    };

    const show = function(content, delAll = true) {
        if (delAll) {
            wnds.closeAll();
        }

        _win.drag().setZ(11);

        const isMenuOpen = document.body.classList.contains(CSS_MENU_OPEN);
        const xPos = isMenuOpen ? 21 : 1;
        _win.vw_vh().setXY(xPos, 5, -1);

        const innerContent = typeof content === "string" ? `<div>${content}</div>` : (content.innerHTML || content);

        const html = `
            <div class="window-info">
                <div class="btn-wrapper">
                    <button class="btn-close tt-left" onclick="wnds.winfo.close()">X</button>
                </div>
                <div class="div-info">${innerContent}</div>
            </div>
        `;

        _win.setHtml(html);
        _win.show();
    };

    const showPre = function(text) {
        const content = `<pre class="pre-text">${text}</pre>`;
        show(content);
    };

    return {
        show: show,
        showe: showPre,
        close: close,
        getElement: () => _win.getElement()
    };
};


// ============================================================================
// HELPER PRIVATI
// ============================================================================

/**
 * Aggiorna l'area di output con HTML formattato.
 *
 * @param {string} html - Contenuto HTML da visualizzare.
 */
const _setResponseHtml = function(html) {
    const outputContainer = document.querySelector("#id-text-out .div-text");
    
    if (!outputContainer) {
        console.error("_setResponseHtml: contenitore non trovato");
        return;
    }
    
    outputContainer.innerHTML = html;
    outputContainer.scrollTo({
        top: outputContainer.scrollHeight,
        behavior: "smooth"
    });
};

/**
 * Cambia il tema visivo dell'applicazione.
 *
 * @param {string} theme - 'light' o 'dark'.
 * @returns {void}
 */
const _updateThemeAsync = async function(theme) {
    if (!theme) {
        console.error("_updateThemeAsync: tema non specificato");
        return;
    }

    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);
    
    await UaDb.save(DATA_KEYS.KEY_THEME, theme);
};


// ============================================================================
// GESTORI AZIONI MENU (Privati)
// ============================================================================

const _actionShowReadme = function() {
    wnds.wdiv.show(help1_html);
};

const _actionShowQuickstart = function() {
    wnds.wdiv.show(help2_html);
};

const _actionViewConversationAsync = async function() {
    const thread = await idbMgr.read(DATA_KEYS.KEY_THREAD);
    if (!thread) {
        await alert("Nessuna conversazione attiva.");
        return;
    }
    const text = messages2text(thread);
    wnds.wpre.show(text);
};

const _actionViewContextAsync = async function() {
    const context = await idbMgr.read(DATA_KEYS.PHASE2_CONTEXT);
    if (!context) {
        await alert("Nessun contesto disponibile.");
        return;
    }
    wnds.wpre.show(context);
};

const _actionSaveKnowledgeBaseAsync = async function() {
    const chunks = await idbMgr.read(DATA_KEYS.PHASE0_CHUNKS);
    const index = await idbMgr.read(DATA_KEYS.PHASE1_INDEX);

    if (!chunks || !index) {
        await alert("Creare prima una KB valida.");
        return;
    }

    const nameRaw = await prompt("Nome per archiviare la Knowledge Base:");
    // nameRaw può essere null se l'utente clicca Annulla (gestito da uadialog.js)
    if (nameRaw === null) {
        return;
    }
    
    const nameTrimmed = nameRaw.trim();
    if (nameTrimmed.length === 0) {
        return;
    }

    const sanitizedName = nameTrimmed.replace(/\s+/g, "_");
    const storageKey = `${DATA_KEYS.KEY_KB_PRE}${sanitizedName}`;
    
    await idbMgr.create(storageKey, { chunks: chunks, serializedIndex: index });
    await UaDb.save(DATA_KEYS.ACTIVE_KB_NAME, sanitizedName);
    await updateActiveKbDisplay();
    
    await alert(`Knowledge Base archiviata con successo: ${sanitizedName}`);
};

const _actionSaveConversationAsync = async function() {
    const context = await idbMgr.read(DATA_KEYS.PHASE2_CONTEXT);
    const thread = await idbMgr.read(DATA_KEYS.KEY_THREAD);

    if (!thread || thread.length === 0) {
        await alert("Nessuna conversazione attiva da salvare.");
        return;
    }

    const nameRaw = await prompt("Nome per archiviare la Conversazione:");
    if (nameRaw === null) {
        return;
    }

    const nameTrimmed = nameRaw.trim();
    if (nameTrimmed.length === 0) {
        return;
    }

    const sanitizedName = nameTrimmed.replace(/\s+/g, "_");
    const storageKey = `${DATA_KEYS.KEY_CONVO_PRE}${sanitizedName}`;
    
    await idbMgr.create(storageKey, { context: context, thread: thread });
    await alert(`Conversazione archiviata con successo: ${sanitizedName}`);
};

const _actionLoadKnowledgeBaseAsync = async function(key) {
    if (!key) {
        return;
    }
    
    const data = await idbMgr.read(key);

    if (data && data.chunks && data.serializedIndex) {
        await idbMgr.create(DATA_KEYS.PHASE0_CHUNKS, data.chunks);
        await idbMgr.create(DATA_KEYS.PHASE1_INDEX, data.serializedIndex);
        
        const prefixLen = DATA_KEYS.KEY_KB_PRE.length;
        const name = key.slice(prefixLen);
        
        await UaDb.save(DATA_KEYS.ACTIVE_KB_NAME, name);
        await updateActiveKbDisplay();
        await alert("Knowledge Base caricata correttamente.");
    } else {
        await alert("ERRORE: I dati della KB non sono validi.");
    }
};

const _actionLoadConversationAsync = async function(key) {
    if (!key) {
        return;
    }
    
    const data = await idbMgr.read(key);

    if (data && data.thread) {
        await idbMgr.create(DATA_KEYS.PHASE2_CONTEXT, data.context || "");
        await idbMgr.create(DATA_KEYS.KEY_THREAD, data.thread);
        
        await alert("Conversazione caricata correttamente.");
        await showHtmlThread();
    } else {
        await alert("ERRORE: I dati della conversazione non sono validi.");
    }
};

const _actionLogout = function() {
    WebId.clear();
    window.location.replace("login.html");
};

const _actionShowExampleDocsAsync = async function() {
    const htmlContent = await requestGet("./data/help_test.html");
    wnds.winfo.show(htmlContent);

    const winElement = wnds.winfo.getElement();
    if (!winElement) {
        return;
    }

    const links = winElement.querySelectorAll(".doc-esempio");
    links.forEach(function(link) {
        link.onclick = async function(event) {
            event.preventDefault();
            const fileName = event.currentTarget.dataset.exampleName;
            
            if (fileName) {
                const textContent = await requestGet(`data/${fileName}`);
                const isAlreadyPresent = await DocsMgr.exists(fileName);
                
                if (!isAlreadyPresent) {
                    const cleanedText = cleanDoc(textContent);
                    await DocsMgr.add(fileName, cleanedText);
                    wnds.winfo.close();
                } else {
                    await alert(`Il documento ${fileName} è già presente.`);
                }
            }
        };
    });
};


// ============================================================================
// API PUBBLICA - Windows (wnds)
// ============================================================================

export const wnds = {
    wdiv: null,
    wpre: null,
    winfo: null,

    init: function() {
        wnds.wdiv = _UaWindowFactory("id-wnd-div", "div-text", "wdiv");
        wnds.wpre = _UaWindowFactory("id-wnd-pre", "pre-text", "wpre");
        wnds.winfo = _UaWindowInfoFactory("id-wnd-info");
        
        // Esposizione globale per handler inline legacy (onclick in HTML string)
        window.wnds = wnds;
    },

    closeAll: function() {
        if (wnds.wdiv) { wnds.wdiv.close(); }
        if (wnds.wpre) { wnds.wpre.close(); }
        if (wnds.winfo) { wnds.winfo.close(); }
    },

    /**
     * Recupera l'ultima domanda dell'utente, la riporta nell'input 
     * e rimuove l'ultima interazione dalla cronologia.
     */
    editLastQuestion: async function() {
        const thread = await idbMgr.read(DATA_KEYS.KEY_THREAD);
        
        if (!thread || thread.length === 0) {
            return;
        }

        // Trova l'ultimo messaggio dell'utente
        let lastUserIndex = -1;
        for (let i = thread.length - 1; i >= 0; i--) {
            if (thread[i].role === "user") {
                lastUserIndex = i;
                break;
            }
        }

        if (lastUserIndex === -1) {
            return;
        }

        const lastQuestion = thread[lastUserIndex].content;

        // Tronca la cronologia prima dell'ultimo messaggio utente
        const newThread = thread.slice(0, lastUserIndex);
        
        await idbMgr.create(DATA_KEYS.KEY_THREAD, newThread);
        
        // Riporta il testo nell'input e focalizza
        if (TextInput._inputEl) {
            TextInput._inputEl.value = lastQuestion;
            TextInput._inputEl.focus();
            // Sposta il cursore alla fine
            TextInput._inputEl.setSelectionRange(lastQuestion.length, lastQuestion.length);
        }

        await showHtmlThread();
    }
};


// ============================================================================
// API PUBBLICA - Comandi Generali (Commands)
// ============================================================================

export const Commands = {
    init: function() {
        // Inizializzazione opzionale
    },

    help: function() {
        wnds.wdiv.show(help0_html);
    },

    upload: function() {
        documentUploader.open();
    },

    log: function() {
        UaLog.toggle();
    },

    providerSettings: function() {
        LlmProvider.toggleTreeView();
    }
};


// ============================================================================
// API PUBBLICA - Input Utente (TextInput)
// ============================================================================

export const TextInput = {
    _inputEl: null,

    init: function() {
        TextInput._inputEl = document.querySelector(".text-input");
    },

    handleEnter: function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            TextInput.continueConversationAsync();
        }
    },

    clear: function() {
        if (TextInput._inputEl) {
            TextInput._inputEl.value = "";
            TextInput._inputEl.focus();
        }
    },

    createKnowledgeAsync: async function() {
        UaLog.log("Inizio creazione Knowledge Base...");

        const docNames = await DocsMgr.names();
        const documents = [];

        for (let i = 0; i < docNames.length; i++) {
            const content = await DocsMgr.doc(i);
            documents.push({ name: docNames[i], text: content });
        }

        const validDocs = documents.filter(function(doc) {
            const hasText = doc.text && doc.text.trim().length > 0;
            return hasText;
        });

        if (validDocs.length === 0) {
            await alert("Nessun documento valido trovato nella lista documenti.");
            return;
        }

        const msgConfirm = `Confermi la creazione della KB a partire da ${validDocs.length} documenti?`;
        const confirmed = await confirm(msgConfirm);

        if (!confirmed) {
            return;
        }

        _Spinner.show();
        await UaSender.sendEventAsync("ragindex", "createKnowledge");

        // Timeout per permettere allo spinner di apparire
        setTimeout(async function() {
            try {
                const kbData = await ragEngine.createKnowledgeBase(validDocs);
                const { chunks, serializedIndex } = kbData;

                await idbMgr.create(DATA_KEYS.PHASE0_CHUNKS, chunks);
                await idbMgr.create(DATA_KEYS.PHASE1_INDEX, serializedIndex);
                await UaDb.delete(DATA_KEYS.ACTIVE_KB_NAME);
                
                await updateActiveKbDisplay();

                const successMsg = `Knowledge Base creata con successo: ${chunks.length} frammenti generati.`;
                await alert(successMsg);

            } catch (error) {
                if (error && error.code === 499) {
                    return;
                }
                const errorDetail = error.message || error;
                const errorCode = error.code ? `[${error.code}] ` : "";
                await alert(`ERRORE CRITICO:\n${errorCode}${errorDetail}`);
                console.error("TextInput.createKnowledgeAsync:", error);
            } finally {
                _Spinner.hide();
            }
        }, 50);
    },

    startConversationAsync: async function() {
        if (!TextInput._inputEl) {
            return;
        }

        const query = TextInput._inputEl.value.trim();

        if (query.length === 0) {
            await alert("Inserisci una domanda per iniziare.");
            return;
        }

        const index = await idbMgr.read(DATA_KEYS.PHASE1_INDEX);
        const chunks = await idbMgr.read(DATA_KEYS.PHASE0_CHUNKS);

        if (!index) {
            await alert("Nessuna Knowledge Base trovata. Eseguire l'Azione 1 prima di iniziare.");
            return;
        }

        _Spinner.show();
        await UaSender.sendEventAsync("ragindex", "startConversation");

        setTimeout(async function() {
            try {
                await idbMgr.delete(DATA_KEYS.KEY_THREAD);

                const kbData = { index: index, chunks: chunks };
                const thread = [{ role: "user", content: query }];

                await AppMgr.initConfig();

                // 1. Workflow RAG: Recupero ed ottimizzazione contesto
                const context = await ragEngine.getOptimizedContext(query, kbData, thread);
                await idbMgr.create(DATA_KEYS.PHASE2_CONTEXT, context);

                // 2. Generazione risposta LLM
                const answer = await ragEngine.generateResponse(context, thread);

                thread.push({ role: "assistant", content: answer });
                await idbMgr.create(DATA_KEYS.KEY_THREAD, thread);
                
                await showHtmlThread();
                TextInput.clear();

            } catch (error) {
                if (error && error.code === 499) {
                    return;
                }
                const errorDetail = error.message || error;
                const errorCode = error.code ? `[${error.code}] ` : "";
                await alert(`ERRORE CRITICO:\n${errorCode}${errorDetail}`);
                console.error("TextInput.startConversationAsync:", error);
            } finally {
                _Spinner.hide();
            }
        }, 50);
    },

    continueConversationAsync: async function() {
        if (!TextInput._inputEl) {
            return;
        }

        const query = TextInput._inputEl.value.trim();

        if (query.length === 0) {
            await alert("Inserisci una domanda.");
            return;
        }

        _Spinner.show();

        setTimeout(async function() {
            try {
                const thread = await idbMgr.read(DATA_KEYS.KEY_THREAD) || [];
                const index = await idbMgr.read(DATA_KEYS.PHASE1_INDEX);
                const chunks = await idbMgr.read(DATA_KEYS.PHASE0_CHUNKS);
                const kbData = { index: index, chunks: chunks };

                thread.push({ role: "user", content: query });
                await AppMgr.initConfig();

                // 1. Ottenimento contesto ottimizzato (può usare dati esistenti)
                const context = await ragEngine.getOptimizedContext(query, kbData, thread);

                // 2. Generazione risposta
                const answer = await ragEngine.generateResponse(context, thread);

                thread.push({ role: "assistant", content: answer });
                await idbMgr.create(DATA_KEYS.KEY_THREAD, thread);
                
                await showHtmlThread();
                TextInput.clear();

            } catch (error) {
                if (error && error.code === 499) {
                    return;
                }
                const errorDetail = error.message || error;
                const errorCode = error.code ? `[${error.code}] ` : "";
                await alert(`ERRORE CRITICO:\n${errorCode}${errorDetail}`);
                console.error("TextInput.continueConversationAsync:", error);
            } finally {
                _Spinner.hide();
            }
        }, 50);
    }
};


// ============================================================================
// API PUBBLICA - Output e Cronologia (TextOutput)
// ============================================================================

export const TextOutput = {
    init: function() {
        // Inizializzazione se necessaria
    },

    copyAsync: async function() {
        const outputEl = document.querySelector("#id-text-out .div-text");
        const rawText = outputEl ? outputEl.textContent.trim() : "";

        if (rawText.length < 2) {
            return;
        }

        try {
            const formattedText = textFormatter(rawText);
            await navigator.clipboard.writeText(formattedText);
            
            outputEl.classList.add("copied");
            setTimeout(function() {
                outputEl.classList.remove("copied");
            }, 2000);
            
        } catch (err) {
            console.error("TextOutput.copyAsync:", err);
        }
    },

    clearHistoryAsync: async function() {
        const confirmed = await confirm("Vuoi iniziare una nuova conversazione?");

        if (confirmed) {
            await idbMgr.delete(DATA_KEYS.KEY_THREAD);
            _setResponseHtml("");
        }
    },

    clearHistoryAndContextAsync: async function() {
        const confirmed = await confirm("Vuoi resettare sia il contesto che la conversazione attiva?");

        if (confirmed) {
            await idbMgr.delete(DATA_KEYS.PHASE2_CONTEXT);
            await idbMgr.delete(DATA_KEYS.KEY_THREAD);
            await updateActiveKbDisplay();
            _setResponseHtml("");
        }
    }
};


// ============================================================================
// API PUBBLICA - Utility UI
// ============================================================================

/**
 * Carica e applica il tema salvato.
 *
 * @returns {void}
 */
export const getTheme = async function() {
    const theme = await UaDb.read(DATA_KEYS.KEY_THEME);
    const isLight = theme === "light";
    
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);
};

/**
 * Aggiorna il display informativo sulla KB attualmente attiva.
 *
 * @returns {void}
 */
export const updateActiveKbDisplay = async function() {
    const displayEl = document.getElementById("active-kb-display");

    if (!displayEl) {
        return;
    }

    const hasChunks = await idbMgr.exists(DATA_KEYS.PHASE0_CHUNKS);
    const hasIndex = await idbMgr.exists(DATA_KEYS.PHASE1_INDEX);

    if (!hasChunks || !hasIndex) {
        activeKbState = "Nessuna KB attiva";
        await UaDb.delete(DATA_KEYS.ACTIVE_KB_NAME);
    } else {
        const savedName = await UaDb.read(DATA_KEYS.ACTIVE_KB_NAME);
        activeKbState = savedName || "BASE CORRENTE";
    }

    displayEl.textContent = `KB: ${activeKbState}`;
};

/**
 * Visualizza l'intera cronologia della conversazione corrente.
 *
 * @returns {void}
 */
export const showHtmlThread = async function() {
    const thread = await idbMgr.read(DATA_KEYS.KEY_THREAD);

    if (thread) {
        const html = messages2html(thread);
        _setResponseHtml(html);
    }
};


// ============================================================================
// ASSOCIAZIONE EVENTI (Event Binding)
// ============================================================================

/**
 * Associa tutti gli handler di eventi agli elementi del DOM.
 */
export const bindEventListener = function() {
    
    // Pulsanti Header
    const btnHelp = document.getElementById("btn-help");
    if (btnHelp) { btnHelp.onclick = Commands.help; }
    
    const btnUpload = document.getElementById("btn-upload");
    if (btnUpload) { btnUpload.onclick = Commands.upload; }
    
    const idLog = document.getElementById("id_log");
    if (idLog) { idLog.onclick = Commands.log; }
    
    const btnProvider = document.getElementById("btn-provider-settings");
    if (btnProvider) { btnProvider.onclick = Commands.providerSettings; }

    // Temi
    const btnDark = document.getElementById("btn-dark-theme");
    if (btnDark) { btnDark.onclick = function() { _updateThemeAsync("dark"); }; }
    
    const btnLight = document.getElementById("btn-light-theme");
    if (btnLight) { btnLight.onclick = function() { _updateThemeAsync("light"); }; }

    // Menu Voci - Help e Config
    const menuReadme = document.getElementById("menu-readme");
    if (menuReadme) { menuReadme.onclick = _actionShowReadme; }
    
    const menuQuick = document.getElementById("menu-quickstart");
    if (menuQuick) { menuQuick.onclick = _actionShowQuickstart; }
    
    const menuConfig = document.getElementById("menu-show-config");
    if (menuConfig) { menuConfig.onclick = LlmProvider.showConfig; }
    
    const menuSaveKb = document.getElementById("menu-save-kb");
    if (menuSaveKb) { menuSaveKb.onclick = _actionSaveKnowledgeBaseAsync; }

    // Menu Voci - KB List
    const menuElencoKb = document.getElementById("menu-elenco-kb");
    if (menuElencoKb) {
        menuElencoKb.onclick = async function() {
            const keys = await idbMgr.selectKeys(DATA_KEYS.KEY_KB_PRE);
            const jfh = UaJtfh();
            jfh.append('<div class="data-dialog">');
            jfh.append('<h4>Gestione Knowledge Base</h4>');
            
            if (keys.length > 0) {
                jfh.append('<table class="table-data">');
                jfh.append('<thead><tr><th>Nome</th><th>Azioni</th></tr></thead><tbody>');
                
                keys.forEach(function(key) {
                    const kbName = key.slice(DATA_KEYS.KEY_KB_PRE.length);
                    jfh.append(`<tr><td>${kbName}</td><td>`);
                    jfh.append(`<button class="btn-load-item btn-success" onclick="wnds.loadKB('${key}')">Carica</button>`);
                    jfh.append(`<button class="btn-delete-item btn-danger" style="margin-left:5px" onclick="wnds.deleteKB('${key}')">Elimina</button>`);
                    jfh.append('</td></tr>');
                });
                
                jfh.append('</tbody></table></div>');

                wnds.loadKB = async function(key) {
                    await _actionLoadKnowledgeBaseAsync(key);
                    wnds.winfo.close();
                };
                
                wnds.deleteKB = async function(key) {
                    const kbName = key.slice(DATA_KEYS.KEY_KB_PRE.length);
                    if (await confirm(`Confermi l'eliminazione di '${kbName}'?`)) {
                        await idbMgr.delete(key);
                        const currentActive = await UaDb.read(DATA_KEYS.ACTIVE_KB_NAME);
                        if (currentActive === kbName) {
                            await UaDb.delete(DATA_KEYS.ACTIVE_KB_NAME);
                        }
                        await updateActiveKbDisplay();
                        wnds.winfo.close();
                    }
                };
                wnds.winfo.show(jfh.html());
            } else {
                jfh.append('<p>Nessuna Knowledge Base archiviata.</p></div>');
                wnds.winfo.show(jfh.html());
            }
        };
    }

    const menuViewConvo = document.getElementById("menu-view-convo");
    if (menuViewConvo) { menuViewConvo.onclick = _actionViewConversationAsync; }

    const menuSaveConvo = document.getElementById("menu-save-convo");
    if (menuSaveConvo) { menuSaveConvo.onclick = _actionSaveConversationAsync; }

    const menuElencoConvo = document.getElementById("menu-elenco-convo");
    if (menuElencoConvo) {
        menuElencoConvo.onclick = async function() {
            const keys = await idbMgr.selectKeys(DATA_KEYS.KEY_CONVO_PRE);
            const jfh = UaJtfh();
            jfh.append('<div class="data-dialog">');
            jfh.append('<h4>Gestione Conversazioni</h4>');
            
            if (keys.length > 0) {
                jfh.append('<table class="table-data">');
                jfh.append('<thead><tr><th>Nome</th><th>Azioni</th></tr></thead><tbody>');
                
                keys.forEach(function(key) {
                    const convoName = key.slice(DATA_KEYS.KEY_CONVO_PRE.length);
                    jfh.append(`<tr><td>${convoName}</td><td>`);
                    jfh.append(`<button class="btn-load-item btn-success" onclick="wnds.loadConvo('${key}')">Carica</button>`);
                    jfh.append(`<button class="btn-delete-item btn-danger" style="margin-left:5px" onclick="wnds.deleteConvo('${key}')">Elimina</button>`);
                    jfh.append('</td></tr>');
                });
                
                jfh.append('</tbody></table></div>');

                wnds.loadConvo = async function(key) {
                    await _actionLoadConversationAsync(key);
                    wnds.winfo.close();
                };
                
                wnds.deleteConvo = async function(key) {
                    const convoName = key.slice(DATA_KEYS.KEY_CONVO_PRE.length);
                    if (await confirm(`Confermi l'eliminazione della conversazione '${convoName}'?`)) {
                        await idbMgr.delete(key);
                        wnds.winfo.close();
                    }
                };
                wnds.winfo.show(jfh.html());
            } else {
                jfh.append('<p>Nessuna conversazione archiviata.</p></div>');
                wnds.winfo.show(jfh.html());
            }
        };
    }

    const menuViewContext = document.getElementById("menu-view-context");
    if (menuViewContext) { menuViewContext.onclick = _actionViewContextAsync; }

    const menuElencoDocs = document.getElementById("menu-elenco-docs");
    if (menuElencoDocs) {
        menuElencoDocs.onclick = async function() {
            const arr = await DocsMgr.names();
            const jfh = UaJtfh();
            jfh.append('<div class="docs-dialog">');
            jfh.append('<div class="docs-header">');
            jfh.append('<div class="docs-controls">');
            jfh.append('<label class="select-all-label">');
            jfh.append('<input type="checkbox" id="select-all-docs-checkbox" onclick="document.querySelectorAll(\'.doc-checkbox\').forEach(cb => cb.checked = this.checked)"> Seleziona tutto');
            jfh.append('</label>');
            jfh.append('<div class="docs-btn-group">');
            jfh.append('<button class="btn-warning btn-small" id="delete-selected-docs-btn" onclick="wnds.deleteSelectedDocs()">Cancella Selezionati</button>');
            jfh.append('<button class="btn-danger btn-small" id="clear-all-docs-btn" onclick="wnds.clearAllDocs()">Svuota Tutto</button>');
            jfh.append('</div>');
            jfh.append('</div></div>');

            if (arr.length > 0) {
                jfh.append('<table class="table-data">');
                jfh.append('<thead><tr><th>Selez.</th><th>Nome</th><th>Azioni</th></tr></thead><tbody>');
                arr.forEach(function(name, i) {
                    jfh.append('<tr>');
                    jfh.append(`<td><input type="checkbox" class="doc-checkbox" data-doc-name="${name}"></td>`);
                    jfh.append(`<td>${name}</td>`);
                    jfh.append(`<td><button class="link-show-doc btn-success" onclick="wnds.showDoc(${i})">Visualizza</button></td>`);
                    jfh.append('</tr>');
                });
                jfh.append('</tbody></table>');
            } else {
                jfh.append('<p>Nessun documento caricato.</p>');
            }
            jfh.append('</div>');

            wnds.showDoc = async function(i) {
                const text = await DocsMgr.doc(i);
                wnds.wpre.show(text, false);
            };
            
            wnds.deleteSelectedDocs = async function() {
                const selected = document.querySelectorAll(".doc-checkbox:checked");
                if (selected.length > 0) {
                    const msg = `Confermi l'eliminazione di ${selected.length} documenti?`;
                    if (await confirm(msg)) {
                        for (const cb of selected) {
                            await DocsMgr.delete(cb.dataset.docName);
                        }
                        wnds.winfo.close();
                    }
                }
            };
            
            wnds.clearAllDocs = async function() {
                const msg = "Confermi lo svuotamento totale della Knowledge Base? Questa operazione NON elimina le configurazioni o le chiavi API.";
                if (await confirm(msg)) {
                    await DocsMgr.deleteAll();
                    wnds.winfo.close();
                }
            };
            
            wnds.winfo.show(jfh.html());
        };
    }

    const menuElencoDati = document.getElementById("menu-elenco-dati");
    if (menuElencoDati) {
        menuElencoDati.onclick = async function() {
            const idbKeysToDisplay = [];
            const staticIdb = [DATA_KEYS.PHASE0_CHUNKS, DATA_KEYS.PHASE1_INDEX, DATA_KEYS.PHASE2_CONTEXT, DATA_KEYS.KEY_THREAD];

            for (const k of staticIdb) {
                const exists = await idbMgr.exists(k);
                if (exists) {
                    const v = await idbMgr.read(k);
                    const size = JSON.stringify(v).length;
                    idbKeysToDisplay.push({ key: k, desc: getDescriptionForKey(k), size: size });
                }
            }

            const prefixes = [DATA_KEYS.KEY_KB_PRE, DATA_KEYS.KEY_CONVO_PRE];
            for (const pre of prefixes) {
                const keys = await idbMgr.selectKeys(pre);
                for (const k of keys) {
                    const v = await idbMgr.read(k);
                    const size = JSON.stringify(v).length;
                    idbKeysToDisplay.push({ key: k, desc: getDescriptionForKey(k), size: size });
                }
            }

            const staticLsKeys = [DATA_KEYS.KEY_THEME, DATA_KEYS.KEY_PROVIDER, DATA_KEYS.KEY_API_KEYS, DATA_KEYS.ACTIVE_KB_NAME, DATA_KEYS.KEY_BUILD_STATE];
            const lsFound = [];

            for (const k of staticLsKeys) {
                const val = await UaDb.read(k);
                if (val) {
                    lsFound.push({ key: k, val: val });
                }
            }

            wnds.showData = async function(key, type) {
                const data = type === "ls" ? await UaDb.read(key) : await idbMgr.read(key);
                const content = typeof data === "string" ? data : JSON.stringify(data, null, 2);
                wnds.wpre.show(content, false);
            };

            const jfh = UaJtfh();
            jfh.append('<div>');
            jfh.append('<h4>Dati in IndexedDB</h4>');

            if (idbKeysToDisplay.length > 0) {
                jfh.append('<table class="table-data">');
                jfh.append('<thead><tr><th>Chiave</th><th>Descrizione</th><th>Dimensione</th></tr></thead>');
                jfh.append('<tbody>');

                idbKeysToDisplay.forEach(function(item) {
                    const sizeKB = (item.size / 1024).toFixed(2);
                    jfh.append('<tr>');
                    jfh.append(`<td><a href="#" class="link-show-data" onclick="event.preventDefault(); wnds.showData('${item.key}', 'idb')">${item.key}</a></td>`);
                    jfh.append(`<td>${item.desc}</td>`);
                    jfh.append(`<td class="size">${sizeKB} KB</td>`);
                    jfh.append('</tr>');
                });

                jfh.append('</tbody></table>');
            } else {
                jfh.append('<p>Nessun dato in IndexedDB.</p>');
            }

            jfh.append('<h4>Impostazioni e Configurazioni</h4>');

            if (lsFound.length > 0) {
                jfh.append('<table class="table-data">');
                jfh.append('<thead><tr><th>Chiave</th><th>Descrizione</th><th>Dimensione</th></tr></thead>');
                jfh.append('<tbody>');

                lsFound.forEach(function(item) {
                    const sizeBytes = item.val ? item.val.length : 0;
                    const desc = getDescriptionForKey(item.key);
                    jfh.append('<tr>');
                    jfh.append(`<td><a href="#" class="link-show-data" onclick="event.preventDefault(); wnds.showData('${item.key}', 'ls')">${item.key}</a></td>`);
                    jfh.append(`<td>${desc}</td>`);
                    jfh.append(`<td class="size">${sizeBytes} bytes</td>`);
                    jfh.append('</tr>');
                });

                jfh.append('</tbody></table>');
            } else {
                jfh.append('<p>Nessuna impostazione trovata.</p>');
            }

            jfh.append('</div>');
            wnds.winfo.show(jfh.html());
        };
    }

    const menuDeleteAll = document.getElementById("menu-delete-all");
    if (menuDeleteAll) {
        menuDeleteAll.onclick = async function() {
            const idbKeys = [];
            const lsKeys = [];

            const staticIdb = [DATA_KEYS.PHASE0_CHUNKS, DATA_KEYS.PHASE1_INDEX, DATA_KEYS.PHASE2_CONTEXT, DATA_KEYS.KEY_THREAD];
            for (const k of staticIdb) {
                const exists = await idbMgr.exists(k);
                if (exists) { idbKeys.push(k); }
            }

            const kbKeys = await idbMgr.selectKeys(DATA_KEYS.KEY_KB_PRE);
            idbKeys.push(...kbKeys);

            const convoKeys = await idbMgr.selectKeys(DATA_KEYS.KEY_CONVO_PRE);
            idbKeys.push(...convoKeys);

            const buildChunks = await idbMgr.selectKeys(DATA_KEYS.KEY_CHUNK_RES_PRE);
            idbKeys.push(...buildChunks);

            const buildKbs = await idbMgr.selectKeys(DATA_KEYS.KEY_DOC_KB_PRE);
            idbKeys.push(...buildKbs);

            const staticLs = [DATA_KEYS.KEY_THEME, DATA_KEYS.KEY_PROVIDER, DATA_KEYS.KEY_API_KEYS, DATA_KEYS.ACTIVE_KB_NAME, DATA_KEYS.KEY_BUILD_STATE];
            for (const k of staticLs) {
                const val = await UaDb.read(k);
                if (val) { lsKeys.push(k); }
            }

            const jfh = UaJtfh();
            jfh.append('<div class="delete-dialog">');
            jfh.append('<h4>Seleziona Dati da Cancellare</h4>');

            if (idbKeys.length > 0) {
                jfh.append('<div style="display:flex; justify-content: space-between; align-items: center;">');
                jfh.append('<h5>Dati Principali (IndexedDB)</h5>');
                jfh.append('<label style="font-size: 0.8em; cursor:pointer">');
                jfh.append('<input type="checkbox" onclick="document.querySelectorAll(\'.del-idb-cb\').forEach(cb => cb.checked = this.checked)"> Seleziona tutto');
                jfh.append('</label></div>');
                jfh.append('<table class="table-data">');

                idbKeys.forEach(function(k) {
                    const desc = getDescriptionForKey(k);
                    jfh.append('<tr>');
                    jfh.append(`<td><input type="checkbox" class="del-idb-cb" data-key="${k}" data-storage="idb"> ${k}</td>`);
                    jfh.append(`<td>${desc}</td>`);
                    jfh.append('</tr>');
                });

                jfh.append('</table>');
            }

            if (lsKeys.length > 0) {
                jfh.append('<div style="display:flex; justify-content: space-between; align-items: center; margin-top:10px">');
                jfh.append('<h5>Impostazioni</h5>');
                jfh.append('<label style="font-size: 0.8em; cursor:pointer">');
                jfh.append('<input type="checkbox" onclick="document.querySelectorAll(\'.del-ls-cb\').forEach(cb => cb.checked = this.checked)"> Seleziona tutto');
                jfh.append('</label></div>');
                jfh.append('<table class="table-data">');

                lsKeys.forEach(function(k) {
                    const desc = getDescriptionForKey(k);
                    jfh.append('<tr>');
                    jfh.append(`<td><input type="checkbox" class="del-ls-cb" data-key="${k}" data-storage="ls"> ${k}</td>`);
                    jfh.append(`<td>${desc}</td>`);
                    jfh.append('</tr>');
                });

                jfh.append('</table>');
            }

            jfh.append('<div class="delete-actions" style="margin-top:20px; display:flex; gap:10px">');
            jfh.append('<button class="btn-delete-selected" onclick="wnds.deleteSelectedData()">Cancella Selezionati</button>');
            jfh.append('<button class="btn-delete-all" id="delete-all-btn" onclick="wnds.deleteAllEverything()">Cancella Tutto</button>');
            jfh.append('</div></div>');

            wnds.deleteSelectedData = async function() {
                const idbSelected = Array.from(document.querySelectorAll(".del-idb-cb:checked"));
                const lsSelected = Array.from(document.querySelectorAll(".del-ls-cb:checked"));

                if (idbSelected.length === 0 && lsSelected.length === 0) {
                    await alert("Nessun elemento selezionato.");
                    return;
                }

                if (await confirm("Confermi la cancellazione dei dati selezionati?")) {
                    for (const cb of idbSelected) {
                        await idbMgr.delete(cb.dataset.key);
                    }

                    for (const cb of lsSelected) {
                        const key = cb.dataset.key;
                        if (key.startsWith(DATA_KEYS.KEY_DOC_PRE)) {
                            await DocsMgr.delete(key.slice(DATA_KEYS.KEY_DOC_PRE.length));
                        } else {
                            await UaDb.delete(key);
                        }
                    }

                    await alert("Dati selezionati cancellati con successo.");
                    wnds.winfo.close();
                    await updateActiveKbDisplay();
                }
            };

            wnds.deleteAllEverything = async function() {
                const msg = "ATTENZIONE: Questa azione cancellerà OGNI DATO dell'applicazione in modo irreversibile. Confermi?";
                if (await confirm(msg)) {
                    await idbMgr.clearAll();
                    localStorage.clear();
                    location.reload();
                }
            };

            wnds.winfo.show(jfh.html());
        };
    }

    const menuExamples = document.getElementById("menu-help-esempi");
    if (menuExamples) { menuExamples.onclick = _actionShowExampleDocsAsync; }
    
    const menuApiKey = document.getElementById("menu-add-api-key");
    if (menuApiKey) { menuApiKey.onclick = addApiKey; }
    
    const menuLogout = document.getElementById("menu-logout");
    if (menuLogout) { menuLogout.onclick = _actionLogout; }

    // Interazioni Input
    const textInput = document.querySelector(".text-input");
    if (textInput) {
        textInput.onkeydown = function(e) { TextInput.handleEnter(e); };
    }

    const btnAct1 = document.getElementById("btn-action1-knowledge");
    if (btnAct1) { btnAct1.onclick = function() { TextInput.createKnowledgeAsync(); }; }
    
    const btnAct2 = document.getElementById("btn-action2-start-convo");
    if (btnAct2) { btnAct2.onclick = function() { TextInput.startConversationAsync(); }; }
    
    const btnAct3 = document.getElementById("btn-action3-continue-convo");
    if (btnAct3) { btnAct3.onclick = function() { TextInput.continueConversationAsync(); }; }

    const btnEditFixed = document.getElementById("btn-edit-last-fixed");
    if (btnEditFixed) { btnEditFixed.onclick = function() { wnds.editLastQuestion(); }; }

    const btnClearInput = document.querySelector(".clear-input");
    if (btnClearInput) { btnClearInput.onclick = function() { TextInput.clear(); }; }
    
    const btnCopyOutput = document.querySelector(".copy-output");
    if (btnCopyOutput) { btnCopyOutput.onclick = function() { TextOutput.copyAsync(); }; }
    
    const btnClearHist1 = document.querySelector("#clear-history1");
    if (btnClearHist1) { btnClearHist1.onclick = function() { TextOutput.clearHistoryAsync(); }; }
    
    const btnClearHist2 = document.querySelector("#clear-history2");
    if (btnClearHist2) { btnClearHist2.onclick = function() { TextOutput.clearHistoryAndContextAsync(); }; }

    // Menu Hamburger
    const menuBtn = document.querySelector("#id-menu-btn");
    const menuLabel = document.querySelector("#id-menu-icon-label");
    if (menuBtn && menuLabel) {
        menuBtn.onchange = function() {
            const isOpen = menuBtn.checked;
            document.body.classList.toggle(CSS_MENU_OPEN, isOpen);
            menuLabel.setAttribute("data-tt", isOpen ? "Close" : "Open");
        };
    }
};
