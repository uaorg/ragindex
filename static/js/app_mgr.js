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

let _configLLM = null;
let _clientLLM = null;
let _promptSize = 0;
let _configLoaded = false;

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
     */
    initConfig: async function() {
        if (_configLoaded) {
            return;
        }

        await LlmProvider.loadConfig();

        _configLLM = LlmProvider.getConfig();
        if (!_configLLM || !_configLLM.windowSize) {
            console.error("AppMgr.initConfig: configurazione LLM mancante o non valida");
            return;
        }

        _promptSize = _tokensToBytes(_configLLM.windowSize);

        console.info("AppMgr.initConfig: configurazione caricata.");
        console.info(`Provider: ${_configLLM.provider} | Model: ${_configLLM.model}`);
        console.info(`Window: ${_configLLM.windowSize}k | Prompt: ${_promptSize} bytes`);

        _clientLLM = await LlmProvider.getClient();
        ragEngine.init(_clientLLM, _configLLM.model, _promptSize);
        _configLoaded = true;
    },

    /**
     * Resetta la configurazione forzando un reload al prossimo initConfig.
     */
    resetConfig: function() {
        _configLoaded = false;
    },

    /**
     * Ottiene la configurazione LLM.
     * @returns {Object|null}
     */
    getConfigLLM: function() {
        const result = _configLLM;
        return result;
    },

    /**
     * Ottiene il client LLM.
     * @returns {Object|null}
     */
    getClientLLM: function() {
        const result = _clientLLM;
        return result;
    },

    /**
     * Ottiene la dimensione del prompt.
     * @returns {number}
     */
    getPromptSize: function() {
        const result = _promptSize;
        return result;
    }
};
