/**
 * @fileoverview history_utils.js - Utility per formattazione cronologia conversazioni
 * @description Fornisce funzioni per convertire array di messaggi in HTML o testo puro.
 * @module services/history_utils
 */
"use strict";

// ============================================================================
// COSTANTI PUBBLICHE
// ============================================================================

/**
 * Stringhe fisse per i prompt.
 */
export const PROMPT_ANSWER = "# RISPOSTA";
export const PROMPT_CONTEXT = "# CONTESTO:";
export const PROMPT_INITIAL_QUESTION = "## DOMANDA INIZIALE:";

/**
 * Prefissi per ruoli nei messaggi.
 */
export const QUESTION_PREFIX = "question:";
export const ANSWER_PREFIX = "answer:";

/**
 * Ruoli dei messaggi nel formato standard OpenAI.
 */
export const ROLE_USER = "user";
export const ROLE_ASSISTANT = "assistant";
export const ROLE_SYSTEM = "system";

// ============================================================================
// FUNZIONI PRIVATE
// ============================================================================

/**
 * Controlla se un oggetto messaggio è valido.
 * @param {*} msg - Oggetto da validare
 * @returns {boolean} True se il messaggio è valido
 * @private
 */
const _isValidMessage = (msg) => {
    const isValid = typeof msg === "object" &&
        msg !== null &&
        "role" in msg &&
        "content" in msg;

    if (!isValid) {
        console.error("Malformed history item:", msg);
    }

    return isValid;
};

/**
 * Normalizza il contenuto di un messaggio.
 * @param {string} content - Contenuto da normalizzare
 * @returns {string} Contenuto normalizzato
 * @private
 */
const _normalizeContent = (content) => {
    const normalized = content.replace(/\n{2,}/g, "\n");
    return normalized;
};

/**
 * Formatta un messaggio per la visualizzazione HTML.
 * @param {string} role - Ruolo del messaggio
 * @param {string} content - Contenuto del messaggio
 * @param {boolean} isLastUserMessage - Se è l'ultimo messaggio dell'utente
 * @returns {string} HTML formattato
 * @private
 */
const _formatMessageHtml = (role, content, isLastUserMessage = false) => {
    let html = "";
    let formattedContent = content;

    if (role === ROLE_ASSISTANT) {
        // Aggiunge punto e a capo dopo ogni frase per leggibilità
        formattedContent = content
            .replace(/\./g, ".\n")
            .replace(/\n{2,}/g, "\n");
        html = `<div class="assistant"><b>Assistant:</b><br>${formattedContent}</div>`;
    } else if (role === ROLE_USER) {
        const editButton = isLastUserMessage 
            ? `<button class="btn-edit-last tt-leftx" data-tt="Modifica domanda" onclick="wnds.editLastQuestion()">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
               </button>` 
            : "";
        html = `<div class="user">${editButton}<b>User:</b><br>${formattedContent}</div>`;
    } else if (role === ROLE_SYSTEM) {
        html = `<div class="system"><b>System:</b><br>${formattedContent}</div>`;
    } else {
        console.error("ERROR in role:", role);
        html = "<div>ERROR ROLE</div>";
    }

    return html;
};

/**
 * Formatta un messaggio per la visualizzazione testo puro.
 * @param {string} role - Ruolo del messaggio
 * @param {string} content - Contenuto del messaggio
 * @returns {string} Testo formattato
 * @private
 */
const _formatMessageText = (role, content) => {
    let text = "";

    if (role === ROLE_ASSISTANT) {
        text = `Assistant:\n${content.trim()}\n`;
    } else if (role === ROLE_USER) {
        text = `User:\n${content.trim()}`;
    } else if (role === ROLE_SYSTEM) {
        text = `System:\n${content.trim()}`;
    } else {
        console.error("ERROR in role:", role);
        text = "ERROR ROLE";
    }

    return text;
};

// ============================================================================
// API PUBBLICA
// ============================================================================

/**
 * Converte un array di messaggi in HTML.
 * @param {Array} history - Array di oggetti messaggio {role, content}
 * @returns {string} HTML formattato della conversazione
 * @public
 */
export const messages2html = (history) => {
    let html = "";

    if (!history || !Array.isArray(history)) {
        html = "";
        return html;
    }

    const htmlParts = [];
    
    // Trova l'indice dell'ultimo messaggio dell'utente
    let lastUserIndex = -1;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === ROLE_USER) {
            lastUserIndex = i;
            break;
        }
    }

    for (let i = 0; i < history.length; i++) {
        const msg = history[i];
        if (!_isValidMessage(msg)) {
            continue;
        }

        const role = msg.role;
        let content = msg.content;
        content = _normalizeContent(content);

        const isLastUser = (i === lastUserIndex);
        const partHtml = _formatMessageHtml(role, content, isLastUser);
        htmlParts.push(partHtml);
    }

    html = htmlParts.join("\n");
    return html;
};

/**
 * Converte un array di messaggi in testo puro.
 * @param {Array} history - Array di oggetti messaggio {role, content}
 * @returns {string} Testo formattato della conversazione
 * @public
 */
export const messages2text = (history) => {
    let text = "";

    if (!history || !Array.isArray(history)) {
        text = "";
        return text;
    }

    const textParts = [];

    for (const msg of history) {
        if (!_isValidMessage(msg)) {
            continue;
        }

        const role = msg.role;
        let content = msg.content;
        content = _normalizeContent(content);

        const partText = _formatMessageText(role, content);
        textParts.push(partText);
    }

    text = textParts.join("\n====================\n");
    text = text.replace(/\n{2,}/g, "\n");
    return text;
};

/**
 * Formatta testo puro per la visualizzazione.
 * @param {string} txt - Testo da formattare
 * @returns {string} Testo formattato
 * @public
 */
export const textFormatter = (txt) => {
    let formatted = "";

    if (!txt) {
        formatted = "";
        return formatted;
    }

    // Rimuove tag HTML
    let plainText = txt.replace(/<[^>]*>/g, "");

    // Divide in frasi
    const sentences = plainText.split(/([.!?:])(?=\s|$)/);

    const formattedSentences = [];

    for (let i = 0; i < sentences.length; i += 2) {
        let sentence = sentences[i];
        const delimiter = sentences[i + 1] || "";

        if (sentence.trim().length > 0) {
            const formattedSentence = "  " + sentence.trim() + delimiter;
            formattedSentences.push(formattedSentence);
        }
    }

    formatted = formattedSentences.join("\n");

    // Sostituisce pattern User: e Assistant:
    formatted = formatted.replace(/User:/g, "\n\nUSER:\n");
    formatted = formatted.replace(/Assistant:/g, "\n\nASSISTANT:\n");
    formatted = formatted.trim();

    return formatted;
};
