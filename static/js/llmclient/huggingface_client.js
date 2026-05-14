/**
 * huggingface_client.js - Client per l'integrazione con le API di Hugging Face.
 *
 * Questo modulo gestisce la comunicazione con i modelli ospitati su Hugging Face,
 * inclusa la validazione dei payload, la gestione dei timeout e delle interruzioni.
 *
 * @module  HuggingFaceClient
 * @version 1.1.0
 * @date    2026-05-14
 * @author  Gemini CLI
 */

"use strict";

/**
 * Adatta il payload per le API Hugging Face.
 *
 * @param {Object} payload - Il payload originale.
 * @returns {Object} Il payload adattato.
 * @throws {Error} Se il parametro 'model' è mancante.
 */
const adaptHuggingFacePayload = function (payload) {
  // Fail Fast
  if (!payload || !payload.model) {
    console.error("adaptHuggingFacePayload: parametro 'model' mancante");
    throw new Error("Il parametro 'model' è obbligatorio nel payload per HuggingFace.");
  }

  const adapted = {
    model: payload.model,
    messages: payload.messages,
    temperature: payload.temperature,
    max_tokens: payload.max_tokens,
    top_p: payload.top_p,
    top_k: payload.top_k,
    stop: payload.stop,
  };

  // Rimuove le chiavi con valore `undefined` per evitare errori dall'API
  for (const key in adapted) {
    if (adapted[key] === undefined) {
      delete adapted[key];
    }
  }

  const result = adapted;
  return result;
};

class HuggingFaceClient {
  /**
   * Inizializza il client con la chiave API.
   *
   * @param {string} apiKey - La chiave API per l'autenticazione.
   */
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://router.huggingface.co/v1/chat/completions";
    this.abortController = null;
    this.isCancelled = false;
  }

  /**
   * Invia una richiesta di generazione contenuto al modello Hugging Face.
   *
   * @param {Object} payload - Dati della richiesta.
   * @param {number} [timeout=60] - Tempo massimo di attesa in secondi.
   * @returns {Promise<Object>} Oggetto risultato con {ok, response, data, error}.
   */
  async sendRequest(payload, timeout = 60) {
    const apiKey = this.apiKey;
    const authHeader = `Bearer ${apiKey}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: authHeader,
    };

    let adaptedPayload;
    try {
      adaptedPayload = adaptHuggingFacePayload(payload);
    } catch (error) {
      const valError = this._createError(error.message, "ValidationError");
      const res = this._createResult(false, null, null, valError);
      return res;
    }

    const baseUrl = this.baseUrl;
    const result = await this._fetch(baseUrl, adaptedPayload, headers, timeout);

    let finalResult = null;

    if (result.ok) {
      try {
        const responseData = result.response.choices[0].message.content;
        finalResult = this._createResult(true, result.response, responseData);
      } catch (error) {
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

  /**
   * Annulla la richiesta attualmente in corso.
   *
   * @returns {boolean} True se una richiesta è stata effettivamente interrotta.
   */
  cancelRequest() {
    this.isCancelled = true;
    let success = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      success = true;
    }

    return success;
  }

  _createResult(ok, response = null, data = null, error = null) {
    return {
      ok,
      response,
      data,
      error,
    };
  }

  _createError(message, type, code, details) {
    return {
      message: message || null,
      type: type || null,
      code: code || null,
      details: {
        message: details?.message || null,
        type: details?.type || null,
        param: details?.param || null,
        code: details?.code || null,
      },
    };
  }

  async _handleHttpError(response) {
    const errorMessages = {
      400: "Richiesta non valida",
      401: "Non autorizzato - Controlla la API key",
      403: "Accesso negato",
      404: "Endpoint non trovato",
      429: "Troppe richieste - Rate limit superato",
      500: "Errore interno del server",
      503: "Servizio non disponibile",
    };

    let detailsContent;
    let errorType = "HTTPError";
    let message = errorMessages[response.status] || `Errore HTTP ${response.status}`;

    try {
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        detailsContent = await response.json();
        if (response.status === 400 && detailsContent) {
          const errorMsg = typeof detailsContent.error === "string" ? detailsContent.error : detailsContent.message || detailsContent.error?.message;
          if (
            errorMsg &&
            (errorMsg.includes("token limit") || errorMsg.includes("token exceeded") || errorMsg.includes("input too long") || errorMsg.includes("context length") || errorMsg.includes("max tokens"))
          ) {
            message = "Input troppo lungo - Superato il limite di token";
            errorType = "TokenLimitError";
          }
        }
      } else {
        detailsContent = await response.text();
        if (response.status === 400 && (detailsContent.includes("token limit") || detailsContent.includes("input too long") || detailsContent.includes("context length"))) {
          message = "Input troppo lungo - Superato il limite di token";
          errorType = "TokenLimitError";
        }
      }
    } catch (e) {
      detailsContent = { message: "Impossibile estrarre i dettagli dell'errore" };
    }
    return this._createError(message, errorType, response.status, typeof detailsContent === "string" ? { message: detailsContent } : detailsContent);
  }

  _handleNetworkError(error) {
    if (error.name === "AbortError") {
      if (this.isCancelled) {
        return this._createError("Richiesta interrotta dall'utente dall'utente", "CancellationError", 499, { message: "La richiesta è stata interrotta volontariamente dall'utente" });
      } else {
        return this._createError("Richiesta interrotta per timeout", "TimeoutError", 408, { message: "La richiesta è stata interrotta a causa di un timeout", isTimeout: true });
      }
    }
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      return this._createError("Errore di rete", "NetworkError", 0, { message: "Impossibile raggiungere il server. Controlla la connessione." });
    }
    return this._createError("Errore imprevisto", error.name || "UnknownError", 500, { message: error.message || "Si è verificato un errore sconosciuto" });
  }

  /**
   * Esegue la chiamata fetch effettiva con gestione del timeout.
   *
   * @param {string} url - URL dell'endpoint API.
   * @param {Object} payload - Corpo della richiesta in formato Hugging Face.
   * @param {Object} headers - Header HTTP per l'autenticazione.
   * @param {number} [timeout=60] - Timeout in secondi.
   * @returns {Promise<Object>} Risultato della fetch.
   * @private
   */
  async _fetch(url, payload, headers, timeout = 60) {
    this.isCancelled = false;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Preparazione timeout in millisecondi
    const timeoutMs = timeout * 1000;
    const timeoutId = setTimeout(() => {
      if (this.abortController) {
        this.abortController.abort();
      }
    }, timeoutMs);

    let result = null;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
        signal: signal,
      });

      clearTimeout(timeoutId);

      if (this.isCancelled) {
        const cancelErr = this._createError(
          "Richiesta interrotta dall'utente",
          "CancellationError",
          499,
          { message: "La richiesta è stata interrotta volontariamente dall'utente" }
        );
        result = this._createResult(false, null, null, cancelErr);
      } else if (!response.ok) {
        const httpErr = await this._handleHttpError(response);
        result = this._createResult(false, null, null, httpErr);
      } else {
        const respJson = await response.json();
        result = this._createResult(true, respJson);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const networkErr = this._handleNetworkError(error);
      result = this._createResult(false, null, null, networkErr);
    } finally {
      this.abortController = null;
    }

    return result;
  }
}

export { HuggingFaceClient };