/**
 * openai_client.js - Client per l'integrazione con le API di OpenAI.
 *
 * Questo modulo gestisce la comunicazione con i modelli OpenAI tramite API
 * compatible OpenAI, inclusa la validazione dei payload, la gestione dei
 * timeout e delle interruzioni.
 *
 * @module  OpenAIClient
 * @version 1.0.0
 * @date    2026-06-27
 * @author  Gemini CLI
 */

"use strict";

import { BaseClient } from "./base_client.js";

/**
 * Adatta il payload per le API OpenAI.
 *
 * @param {Object} payload - Il payload originale.
 * @returns {Object} Il payload adattato.
 * @throws {Error} Se il parametro 'model' è mancante.
 */
const adaptOpenAIPayload = function(payload) {
  if (!payload || !payload.model) {
    console.error("adaptOpenAIPayload: parametro 'model' mancante");
    throw new Error("Il parametro 'model' è obbligatorio nel payload per OpenAI.");
  }

  const adapted = {
    model: payload.model,
    messages: payload.messages,
    temperature: payload.temperature,
    max_tokens: payload.max_tokens,
    top_p: payload.top_p,
    stop: payload.stop,
    presence_penalty: payload.presence_penalty,
    frequency_penalty: payload.frequency_penalty,
    n: payload.n,
    seed: payload.seed,
    user: payload.user,
    response_format: payload.response_format,
    tools: payload.tools,
    tool_choice: payload.tool_choice,
    parallel_tool_calls: payload.parallel_tool_calls,
  };

  for (const key in adapted) {
    if (adapted[key] === undefined) {
      delete adapted[key];
    }
  }

  const result = adapted;
  return result;
};

class OpenAIClient extends BaseClient {
  /**
   * Inizializza il client con la chiave API e URL base opzionale.
   *
   * @param {string} apiKey - La chiave API per l'autenticazione.
   * @param {string} [baseUrl=null] - URL base personalizzato (es. per provider API-compatibili).
   */
  constructor(apiKey, baseUrl = null) {
    const url = baseUrl || "https://api.openai.com/v1/chat/completions";
    super(apiKey, url);
  }

  /**
   * Invia una richiesta di generazione contenuto al modello OpenAI.
   *
   * @param {Object} payload - Dati della richiesta.
   * @param {number} [timeout=60] - Tempo massimo di attesa in secondi.
   * @returns {Promise<Object>} Oggetto risultato con {ok, response, data, error}.
   */
  async sendRequest(payload, timeout = 60) {
    const authHeader = `Bearer ${this.apiKey}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: authHeader,
      "HTTP-Referer": "https://github.com/u-a/llm_test_js",
      "X-Title": "LLM Model Tester",
    };

    let adaptedPayload;

    try {
      adaptedPayload = adaptOpenAIPayload(payload);
    } catch (error) {
      console.error("OpenAIClient.sendRequest:", error);
      const valError = this._createError(error.message, "ValidationError");
      const res = this._createResult(false, null, null, valError);
      return res;
    }

    const result = await this._fetch(this.baseUrl, adaptedPayload, headers, timeout);

    let finalResult = null;

    if (result.ok) {
      try {
        const message = result.response.choices[0].message;
        let responseData;

        if (message.tool_calls) {
          responseData = message;
        } else {
          responseData = message.content || "";
        }

        finalResult = this._createResult(true, result.response, responseData);
      } catch (error) {
        console.error("OpenAIClient.sendRequest:", error);
        const parseErr = this._createError(
          "Invalid response structure",
          "ParsingError",
          null,
          error
        );
        finalResult = this._createResult(false, null, null, parseErr);
      }
    } else {
      finalResult = result;
    }

    return finalResult;
  }
}

export { OpenAIClient };
