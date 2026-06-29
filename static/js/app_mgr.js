/**
 * app_mgr.js - Gestore configurazione applicazione.
 * Inizializza e gestisce la configurazione del provider LLM.
 *
 * @module app_mgr
 * @version 0.1.0
 * @date 2026-05-01
 * @author Team Sviluppo
 */
"use strict";

import { LlmProvider } from "./llm_provider.js";
import { ragEngine } from "./rag_engine.js";

// ============================================================================
// COSTANTI DI MODULO
// ============================================================================

const BYTES_PER_TOKEN = 3;
const PROMPT_OVERHEAD_PERCENT = 0.1;

// ============================================================================
// VARIABILI PRIVATE
// ============================================================================

let _clientLLM = null;

// ============================================================================
// FUNZIONI PRIVATE
// ============================================================================

/**
 * Converte token in byte.
 * @param {number} nk - Token in migliaia.
 * @returns {number} Byte stimati.
 */
const _tokensToBytes = function(nk = 32) {
    const rawBytes = 1024 * nk * BYTES_PER_TOKEN;
    const overhead = rawBytes * PROMPT_OVERHEAD_PERCENT;
    const result = Math.trunc(rawBytes + overhead);
    return result;
};

// ============================================================================
// API PUBBLICA
// ============================================================================

export const AppMgr = {

    /**
     * Inizializza l'applicazione.
     */
    initApp: async function() {
        await LlmProvider.init();
        await AppMgr.initConfig();
    },

    /**
     * Inizializza la configurazione LLM.
     * Viene eseguita ogni volta senza cache: carica la configurazione corrente
     * da LlmProvider e aggiorna ragEngine col client e modello attivo.
     */
    initConfig: async function() {
        await LlmProvider.loadConfig();

        const config = LlmProvider.getConfig();
        if (!config || !config.windowSize) {
            console.error("AppMgr.initConfig: configurazione LLM mancante o non valida");
            return;
        }

        const promptSize = _tokensToBytes(config.windowSize);

        console.info("AppMgr.initConfig: configurazione caricata.");
        console.info(`Provider: ${config.provider} | Model: ${config.model}`);
        console.info(`Window: ${config.windowSize}k | Prompt: ${promptSize} bytes`);

        _clientLLM = await LlmProvider.getClient();
        ragEngine.init(_clientLLM, config.model, promptSize);
    },

    /**
     * Ottiene il client LLM attivo.
     * @returns {Object|null}
     */
    getClientLLM: function() {
        return _clientLLM;
    }
};
