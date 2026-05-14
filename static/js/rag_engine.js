/**
 * rag_engine.js - Motore RAG principale.
 *
 * Coordina la creazione della knowledge base, il recupero del contesto e
 * la generazione delle risposte tramite LLM. Gestisce il ciclo di vita del
 * Web Worker per le operazioni intensive.
 *
 * @module  rag_engine
 * @version 1.1.0
 * @date    2026-05-14
 * @author  Gemini CLI
 */

"use strict";

import { UaLog } from "./services/ualog3.js";
import { promptBuilder } from "./llm_prompts.js";
import { WORKER_PATH } from "./services/worker_path.js";
import { cleanLlmResponse } from "./services/history_utils.js";

// ============================================================================
// COSTANTI DI MODULO
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const DISTILLATION_TOKEN_LIMIT = 50;
const CONTEXT_PERCENTAGE = 0.7;

// ============================================================================
// STATO PRIVATO DEL MODULO
// ============================================================================

let _worker = null;
const _requestPromises = {};
let _client = null;
let _model = null;
let _promptSize = 0;

// ============================================================================
// FUNZIONI PRIVATE - Gestione Worker
// ============================================================================

/**
 * Inizializza il Web Worker per l'elaborazione RAG.
 * Configura gli handler per i messaggi e gli errori.
 *
 * @private
 */
const _initWorker = function () {
  if (_worker) {
    return;
  }

  const workerUrl = new URL(WORKER_PATH, import.meta.url).href;
  _worker = new Worker(workerUrl);

  /**
   * Handler per i messaggi dal worker.
   */
  _worker.onmessage = function (e) {
    const { status, command, result, error, progress } = e.data;

    if (status === "progress") {
      UaLog.log(progress);
      return;
    }

    const promise = _requestPromises[command];
    if (promise) {
      if (status === "complete") {
        promise.resolve(result);
      } else if (status === "error") {
        const err = new Error(error);
        promise.reject(err);
      }
      delete _requestPromises[command];
    }
  };

  /**
   * Handler per gli errori del worker.
   */
  _worker.onerror = function (e) {
    console.error("_initWorker (error):", e);
    const errorMsg = "Errore critico nel worker RAG";
    const workerErr = new Error(errorMsg);

    Object.values(_requestPromises).forEach(function (p) {
      p.reject(workerErr);
    });

    // Pulizia totale dei riferimenti alle promesse
    for (const key in _requestPromises) {
      delete _requestPromises[key];
    }
  };
};

/**
 * Invia un comando al worker e restituisce una promessa.
 *
 * @param {string} command - Nome del comando da eseguire.
 * @param {any} data - Dati associati al comando.
 * @returns {Promise<any>} Risultato dell'operazione.
 * @private
 */
const _postCommandToWorker = function (command, data) {
  _initWorker();

  const promise = new Promise(function (resolve, reject) {
    _requestPromises[command] = { resolve, reject };
    _worker.postMessage({ command, data });
  });

  return promise;
};

// ============================================================================
// FUNZIONI PRIVATE - LLM Communication
// ============================================================================

const _distillQuery = async function (query) {
    if (!query) {
        console.error("ragEngine._distillQuery: query mancante");
        return "";
    }

    UaLog.log("🔍 Ottimizzazione termini di ricerca...");

    const promptText = `
# COMPITO
Agisci come un esperto di Information Retrieval. Data la domanda di un utente, estrai esclusivamente una lista di 5-8 parole chiave (nomi, entità, concetti tecnici) ottimizzate per una ricerca lessicale BM25.

# REGOLE
1. Restituisci SOLO le parole chiave separate da spazio.
2. NON rispondere alla domanda.
3. NON aggiungere commenti, introduzioni o conclusioni.
4. Rimuovi verbi di cortesia (vorrei, sapresti, dimmi) e focalizzati sul core informativo.

# DOMANDA UTENTE
${query}

# PAROLE CHIAVE OTTIMIZZATE:
`.trim();

    const payload = {
        model: _model,
        messages: [{ role: "user", content: promptText }],
        temperature: 0.1,
        max_tokens: DISTILLATION_TOKEN_LIMIT
    };

    const rr = await _sendRequest(_client, payload, "ERR_DISTILL_QUERY");

    let result = query;
    if (rr && rr.ok) {
        result = rr.data.trim();
    } else {
        console.warn("ragEngine._distillQuery: distillazione fallita, uso query originale.");
    }

    return result;
};

const _sleep = function (ms) {
    const promise = new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
    return promise;
};

const _sendRequest = async function (client, payload, errorTag) {
    if (!client || !payload) {
        console.error("ragEngine._sendRequest: client o payload mancanti");
        return null;
    }

    let result = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const rr = await client.sendRequest(payload, 90);

        if (!rr || rr.ok) {
            result = rr;
            break;
        }

        const err = rr.error;
        console.error(`ragEngine.${errorTag} (Attempt ${attempt}/${MAX_RETRIES}):`, err);

        if (err && (err.code === 408 || [500, 502, 503, 504].includes(err.code))) {
            UaLog.log(`Transient error ${err.code}. Retrying...`);
            await _sleep(RETRY_DELAY_MS);
        } else {
            result = rr;
            break;
        }
    }
    return result;
};

// ============================================================================
// API PUBBLICA
// ============================================================================

export const ragEngine = {

    init: function (client, model, promptSize) {
        _client = client;
        _model = model;
        _promptSize = promptSize;

        if (!_worker) {
            _initWorker();
        }
    },

    stop: function () {
        if (_worker) {
            _worker.terminate();
            _worker = null;
            Object.values(_requestPromises).forEach(function (p) {
                p.reject(new Error("Operazione interrotta dall'utente"));
            });
            Object.keys(_requestPromises).forEach(function (key) {
                delete _requestPromises[key];
            });
            console.log("ragEngine.stop: Worker terminato.");
        }
    },

    createKnowledgeBase: function (documents) {
        const promise = _postCommandToWorker("createKnowledgeBase", documents);
        return promise;
    },

    buildContext: function (serializedIndex, allChunks, query) {
        if (!serializedIndex || !allChunks || !query) {
            console.error("ragEngine.buildContext: input mancanti");
            return "";
        }

        const index = lunr.Index.load(JSON.parse(serializedIndex));
        const searchResults = index.search(query);

        let context = "";
        const MAX_CONTEXT_LENGTH = _promptSize * CONTEXT_PERCENTAGE;
        const usedParentIds = new Set();

        for (const result of searchResults) {
            const parentId = result.ref.split("#")[0];
            if (!usedParentIds.has(parentId)) {
                usedParentIds.add(parentId);
                const chunk = allChunks.find(function (c) { return c.id === parentId; });
                if (chunk) {
                    const chunkSnippet = `--- Context: ${chunk.id} (Score: ${result.score.toFixed(4)}) ---\n${chunk.text}\n\n`;
                    if ((context + chunkSnippet).length <= MAX_CONTEXT_LENGTH) {
                        context += chunkSnippet;
                    } else {
                        break;
                    }
                }
            }
        }
        return context;
    },

    getOptimizedContext: async function (query, kbData, thread) {
        const isFirstQuestion = !thread || thread.length <= 1;

        if (!kbData || !kbData.index || !isFirstQuestion) {
            return "";
        }

        const searchTerms = await _distillQuery(query);
        UaLog.log("📄 Recupero informazioni pertinenti...");

        const context = ragEngine.buildContext(kbData.index, kbData.chunks, searchTerms);
        return context;
    },

    generateResponse: async function (context, thread) {
        const messages = promptBuilder.answerPrompt(context, thread);
        const payload = {
            model: _model,
            messages: messages,
            random_seed: 42,
            temperature: 0.7,
            max_tokens: 4000
        };

        UaLog.log("✍️ Generazione risposta LLM...");
        const rr = await _sendRequest(_client, payload, "ERR_GENERATE_RESPONSE");

        if (!rr || !rr.ok) {
            throw rr ? rr.error : new Error("Request failed without response");
        }

        const result = cleanLlmResponse(rr.data);
        return result;
    }
};
