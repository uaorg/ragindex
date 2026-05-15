/**
 * gemini_client.js - Client per l'integrazione con le API di Google Gemini.
 *
 * Questo modulo gestisce la comunicazione con i modelli Gemini, inclusa la
 * trasformazione dei payload, la gestione dei timeout e delle interruzioni.
 *
 * @module  GeminiClient
 * @version 1.1.0
 * @date    2026-05-14
 * @author  Gemini CLI
 */

"use strict";

/**
 * Converte un payload generico nel formato richiesto dalle API Gemini.
 *
 * @param {Object} payload - Il payload originale con messaggi e configurazione.
 * @returns {Object} Il payload formattato per Gemini.
 */
const convertToGemPayload = function (payload) {
  const geminiPayload = {
    contents: [],
    system_instruction: null,
    generationConfig: {
      temperature: payload.temperature !== undefined ? payload.temperature : 1.0,
      maxOutputTokens: payload.max_tokens !== undefined ? payload.max_tokens : 8192,
      topP: payload.top_p !== undefined ? payload.top_p : 0.95,
      topK: 40,
      stopSequences: payload.stop !== undefined ? (Array.isArray(payload.stop) ? payload.stop : [payload.stop]) : [],
      candidateCount: 1,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };

  for (const msg of payload.messages) {
    if (msg.role === 'system') {
      geminiPayload.system_instruction = {
        parts: [{ text: msg.content }]
      };
    } else if (msg.role === 'user') {
      let parts = [];
      if (typeof msg.content === 'string') {
        parts = [{ text: msg.content }];
      } else if (Array.isArray(msg.content)) {
        for (const item of msg.content) {
          if (item.type === 'text') {
            parts.push({ text: item.text });
          } else if (item.type === 'image_url') {
            const imageUrl = item.image_url.url;
            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              parts.push({
                inlineData: {
                  mimeType: matches[1],
                  data: matches[2]
                }
              });
            }
          }
        }
      } else {
        parts = [{ text: String(msg.content) }];
      }
      geminiPayload.contents.push({
        role: 'user',
        parts: parts
      });
    } else if (msg.role === 'assistant') {
      geminiPayload.contents.push({
        role: 'model',
        parts: [{ text: msg.content }]
      });
    }
  }
  return geminiPayload;
}

class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";
    this.abortController = null;
    this.isCancelled = false;
  }

  /**
   * Invia una richiesta di generazione contenuto al modello Gemini.
   *
   * @param {Object} payload - Dati della richiesta (modello, messaggi, ecc.).
   * @param {number} [timeout=60] - Tempo massimo di attesa in secondi.
   * @returns {Promise<Object>} Oggetto risultato con {ok, response, data, error}.
   */
  async sendRequest(payload, timeout = 60) {
    const modelName = payload.model || "gemini-flash-latest";
    const apiKey = this.apiKey;
    const baseUrl = this.baseUrl;
    const url = `${baseUrl}${modelName}:generateContent?key=${apiKey}`;

    const preparedData = convertToGemPayload(payload);

    const result = await this._fetch(url, preparedData, timeout);

    let finalResult = null;

    if (result.ok) {
      try {
        const responseData = result.response.candidates[0].content.parts[0].text;
        finalResult = this._createResult(true, result.response, responseData);
      } catch (error) {
        const errorDetails = this._createError(
          "Struttura risposta non valida",
          "ParsingError",
          null,
          error
        );
        finalResult = this._createResult(false, null, null, errorDetails);
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

  /**
   * Esegue la chiamata fetch effettiva con gestione del timeout.
   *
   * @param {string} url - URL completo della richiesta.
   * @param {Object} payload - Corpo della richiesta in formato Gemini.
   * @param {number} [timeout=60] - Timeout in secondi.
   * @returns {Promise<Object>} Risultato della fetch.
   * @private
   */
  async _fetch(url, payload, timeout = 60) {
    this.isCancelled = false;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Conversione timeout in millisecondi per setTimeout
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
        headers: { "Content-Type": "application/json" },
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

  /**
   * Gestisce gli errori HTTP provenienti dalle API Gemini.
   *
   * @param {Response} response - Oggetto risposta della fetch.
   * @returns {Promise<Object>} Oggetto errore formattato.
   * @private
   */
  async _handleHttpError(response) {
    let detailsContent = null;
    try {
      detailsContent = await response.json();
    } catch (e) {
      detailsContent = { message: "Impossibile estrarre i dettagli dell'errore" };
    }

    const errMsg = detailsContent.error?.message || detailsContent.message || "Errore sconosciuto";
    const status = response.status;
    const fullMsg = `Errore HTTP ${status}: ${errMsg}`;

    const errorObj = this._createError(
      fullMsg,
      "HTTPError",
      status,
      detailsContent
    );

    const errCode = errorObj.code;
    const errText = errorObj.message;
    const alertMsg = `ERRORE API [${errCode}]\n${errText}`;

    // alert è asincrono (sovrascritto in uadialog.js)
    await alert(alertMsg);

    const result = errorObj;
    return result;
  }

  /**
   * Gestisce gli errori di rete o i timeout.
   *
   * @param {Error} error - L'oggetto errore catturato nel try/catch.
   * @returns {Object} Oggetto errore formattato.
   * @private
   */
  _handleNetworkError(error) {
    let errorObj = null;

    if (error.name === "AbortError") {
      const msg = this.isCancelled ? "Richiesta interrotta dall'utente" : "Timeout";
      const code = this.isCancelled ? 499 : 408;

      errorObj = this._createError(msg, "NetworkError", code, error);

      // Non mostriamo alert per l'interruzione manuale dell'utente
      if (this.isCancelled) {
        return errorObj;
      }
    } else {
      errorObj = this._createError("Errore di rete", "NetworkError", 0, error);
    }

    const errCode = errorObj.code;
    const errText = errorObj.message;
    const alertMsg = `ERRORE RETE [${errCode}]\n${errText}`;

    // Nota: in un metodo non-async l'alert asincrono non può essere atteso con await
    // ma la visualizzazione avverrà comunque.
    alert(alertMsg);

    const result = errorObj;
    return result;
  }

  /**
   * Crea un oggetto risultato standard per i metodi pubblici.
   *
   * @param {boolean} ok - Indica se l'operazione ha avuto successo.
   * @param {Object} [response=null] - La risposta grezza dell'API.
   * @param {string} [data=null] - Il testo estratto dalla risposta.
   * @param {Object} [error=null] - Eventuale oggetto errore.
   * @returns {Object} Oggetto risultato {ok, response, data, error}.
   * @private
   */
  _createResult(ok, response = null, data = null, error = null) {
    const result = { ok, response, data, error };
    return result;
  }

  /**
   * Crea un oggetto errore standardizzato.
   *
   * @param {string} message - Messaggio descrittivo.
   * @param {string} type - Categoria dell'errore.
   * @param {number|string} code - Codice identificativo.
   * @param {Object} [details] - Dettagli tecnici o risposta originale.
   * @returns {Object} Oggetto errore {message, type, code, details}.
   * @private
   */
  _createError(message, type, code, details) {
    const error = { message, type, code, details };
    return error;
  }
  }

  export { GeminiClient };