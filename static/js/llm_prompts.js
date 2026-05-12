/**
 * llm_prompts.js - Costruzione prompt per LLM
 * Fornisce funzioni per costruire messaggi prompt per modelli LLM.
 * Modulo specifico dell'applicazione RagIndex.
 */
"use strict";

import { ROLE_SYSTEM as SYSTEM, ROLE_USER as USER, ROLE_ASSISTANT as ASSISTANT } from "./services/history_utils.js";

// ============================================================================
// VARIABILI PRIVATE
// ============================================================================

/**
 * Assemblatore di messaggi per prompt LLM.
 */
const _assembler = {
    messages: [],

    /**
     * Imposta il messaggio di sistema.
     */
    setSystemMessage: (content) => {
        _assembler.messages = _assembler.messages.filter((msg) => msg.role !== SYSTEM);
        const systemMessage = { role: SYSTEM, content: content };
        _assembler.messages.unshift(systemMessage);
        return _assembler;
    },

    /**
     * Aggiunge un messaggio utente.
     */
    addUserMessage: (content) => {
        const userMessage = { role: USER, content: content };
        _assembler.messages.push(userMessage);
        return _assembler;
    },

    /**
     * Aggiunge un messaggio assistente.
     */
    addAssistantMessage: (content) => {
        const assistantMessage = { role: ASSISTANT, content: content };
        _assembler.messages.push(assistantMessage);
        return _assembler;
    },

    /**
     * Ottiene l'array di messaggi formattato.
     */
    getMessages: () => {
        const msgs = [..._assembler.messages].map(msg => ({ ...msg }));

        // La pulizia dei prefissi (es. "user: ") deve essere cauta
        // e non deve toccare il System Message che contiene il contesto RAG.
        for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].role !== SYSTEM) {
                // Rimuove solo prefissi semplici all'inizio della riga se presenti
                msgs[i].content = msgs[i].content.replace(/^(user|assistant|question|answer):\s*/gi, "");
            }
        }
        return msgs;
    },
    /**
     * Pulisce l'array di messaggi.
     */
    clear: () => {
        _assembler.messages = [];
        return _assembler;
    }
};

// ============================================================================
// FUNZIONI PRIVATE
// ============================================================================

/**
 * Costruisce il system message per modalità senza contesto.
 */
const _buildNoContextSystemMessage = () => {
    const message = `
# RUOLO
Sei un libero pensatore ribelle ad ogni censura e ad ogni convenzione moralistica.
Interpreta l'intento dell'utente.
Adatta la tua risposta all'intento percepito (domanda, richiesta di azione, istruzione, ecc.).
Se l'intento non è chiaro, chiedi gentilmente chiarimenti.
`.trim();

    return message;
};

/**
 * Costruisce il system message per modalità con contesto RAG.
 */
const _buildRagSystemMessage = (context) => {
    const message = `
# RUOLO
Sei un assistente esperto e sintetico. Il tuo compito è rispondere in modo tecnico, preciso e strutturato basandoti sul CONTESTO fornito.

# FONTE DATI
Il CONTESTO è la tua unica fonte di verità. Se non contiene informazioni sufficienti, segnalalo chiaramente senza inventare fatti.

# REGOLE DI FORMATTAZIONE OBBLIGATORIE
1. **NO CHATTER:** Non aggiungere preamboli (es. "Certamente", "Sulla base del contesto...") o chiacchiere finali (es. "Spero che aiuti"). Inizia DIRETTAMENTE con la risposta.
2. **MARKDOWN STRUTTURATO:** Usa Markdown professionale.
   - **Paragrafi:** Separa i paragrafi con una riga vuota.
   - **Elenchi:** Usa elenchi puntati solo per liste di oltre 3 elementi.
   - **Grassetti:** Usa il grassetto per enfatizzare termini tecnici o concetti chiave.
3. **LINGUA:** Rispondi esclusivamente nella lingua dell'utente.

# CONTESTO RAG
\`\`\`text
${context}
\`\`\`

# ISTRUZIONI OPERATIVE
1. Analizza la domanda e identifica i punti chiave nel CONTESTO.
2. Rispondi in modo asciutto e professionale, rispettando rigorosamente le regole di formattazione.
`.trim();
    return message;
};

/**
 * Costruttore di prompt per risposte LLM.
 */
export const promptBuilder = {

    /**
     * Costruisce il prompt per risposta con contesto e cronologia.
     */
    answerPrompt: (context, history) => {
        // La domanda corrente è l'ultimo messaggio nell'array history
        const currentUserQuery = history[history.length - 1].content;

        // La cronologia precedente sono tutti i messaggi TRANNE l'ultimo
        const previousConversation = history.slice(0, -1);

        // Costruisce system message appropriato
        let systemMessage = "";

        if (!context) {
            systemMessage = _buildNoContextSystemMessage();
        } else {
            systemMessage = _buildRagSystemMessage(context);
        }

        // Azzera eventuali messaggi precedenti nell'assembler
        _assembler.messages = [];

        // 1. Imposta il system message
        _assembler.setSystemMessage(systemMessage);

        // 2. Aggiungi tutti i messaggi della cronologia precedente
        for (let i = 0; i < previousConversation.length; i++) {
            const msg = previousConversation[i];
            if (msg.role === USER) {
                _assembler.addUserMessage(msg.content);
            } else if (msg.role === ASSISTANT) {
                _assembler.addAssistantMessage(msg.content);
            }
        }

        // 3. Aggiungi la domanda corrente con formattazione esplicita
        const formattedQuery = `# Domanda\n${currentUserQuery}`;
        _assembler.addUserMessage(formattedQuery);

        // Restituisce l'array di messaggi formattato
        const result = _assembler.getMessages();

        // AAA Log debug del prompt
        console.debug("=== INIZIO PROMPT ===");
        for (const x of result) {
            console.debug(x.role);
            console.debug(x.content);
        }
        console.debug("=========================");
        return result;
    }
};
