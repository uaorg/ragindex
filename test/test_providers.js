#!/usr/bin/env node
"use strict";

const fs = require("fs/promises");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const API_KEYS_PATH = path.join(PROJECT_ROOT, "static", "data", "api_x.json");
const MODELS_DIR = path.join(PROJECT_ROOT, "static", "data", "models");

const IMPLEMENTED_CLIENTS = [
  "gemini", "mistral", "groq",
  "openrouter", "cerebras", "siliconflow"
];

const ALPHABET_FROM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const ALPHABET_TO   = "mKpX3vQwL8ZnR4yTbJxF1YHcU9AgNsI2oODh7eMzW5jV6ifqGrPECuS0Btaldk-_";

const PROVIDER_CONFIGS = {
  gemini:      { type: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/models/" },
  mistral:     { type: "openai", baseUrl: "https://api.mistral.ai/v1/chat/completions" },
  groq:        { type: "openai", baseUrl: "https://api.groq.com/openai/v1/chat/completions" },
  openrouter:  { type: "openai", baseUrl: "https://openrouter.ai/api/v1/chat/completions" },
  cerebras:    { type: "openai", baseUrl: "https://api.cerebras.ai/v1/chat/completions" },
  siliconflow: { type: "openai", baseUrl: "https://api.siliconflow.com/v1/chat/completions" },
};

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function decodeApiKeys(data) {
  if (!data?.providers) return data;
  const decoded = JSON.parse(JSON.stringify(data));
  for (const provider of Object.values(decoded.providers)) {
    for (const keyObj of (provider.keys || [])) {
      if (keyObj.key) {
        keyObj.key = [...keyObj.key].map(ch => {
          const idx = ALPHABET_TO.indexOf(ch);
          return idx !== -1 ? ALPHABET_FROM[idx] : ch;
        }).join("");
      }
    }
  }
  return decoded;
}

async function loadModels(providerName) {
  const filePath = path.join(MODELS_DIR, `${providerName}.txt`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content.split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#"))
      .map(line => line.split("|")[0].trim());
  } catch {
    return [];
  }
}

function buildGeminiPayload(messages) {
  const contents = [];
  let systemInstruction = null;
  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else if (msg.role === "user") {
      contents.push({ role: "user", parts: [{ text: msg.content }] });
    } else if (msg.role === "assistant") {
      contents.push({ role: "model", parts: [{ text: msg.content }] });
    }
  }
  const payload = {
    contents,
    generationConfig: {
      temperature: 1.0, maxOutputTokens: 10, topP: 0.95,
      topK: 40, stopSequences: [], candidateCount: 1,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ],
  };
  if (systemInstruction) payload.system_instruction = systemInstruction;
  return payload;
}

async function testModel(provider, modelName, apiKey, config) {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    if (config.type === "gemini") {
      const url = `${config.baseUrl}${modelName}:generateContent?key=${apiKey}`;
      const payload = buildGeminiPayload([{ role: "user", content: "Ciao, rispondi con una parola." }]);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = text.trim();
        if (detail.startsWith("<")) {
          detail = "";
        } else {
          detail = detail.substring(0, 70);
        }
        return { ok: false, elapsed, error: `${res.status} ${res.statusText}${detail ? " - " + detail : ""}` };
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { ok: true, elapsed, preview: text.substring(0, 60).replace(/\n/g, " ") };
    }

    const payload = {
      model: modelName,
      messages: [{ role: "user", content: "Ciao, rispondi con una parola." }],
      max_tokens: 10,
    };
    const res = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let detail = text.trim();
      if (detail.startsWith("<")) {
        detail = "";
      } else {
        detail = detail.substring(0, 70);
      }
      return { ok: false, elapsed, error: `${res.status} ${res.statusText}${detail ? " - " + detail : ""}` };
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return { ok: true, elapsed, preview: text.substring(0, 60).replace(/\n/g, " ") };
  } catch (err) {
    clearTimeout(timeoutId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { ok: false, elapsed, error: err.name === "AbortError" ? "Timeout (30s)" : err.message };
  }
}

function pad(s, len) { return String(s).padEnd(len); }

async function main() {
  console.log(`\n  ${C.bold}RagIndex — Provider & Model Test${C.reset}\n`);

  let raw;
  try {
    raw = JSON.parse(await fs.readFile(API_KEYS_PATH, "utf-8"));
  } catch (err) {
    console.error(`  ${C.red}ERRORE${C.reset} Cannot read ${API_KEYS_PATH}: ${err.message}`);
    process.exit(1);
  }

  const db = decodeApiKeys(raw);

  let totalOk = 0, totalErr = 0, totalSkip = 0;

  const colW = { provider: 14, model: 38, status: 8, time: 8, detail: 50 };

  function printHeader() {
    console.log(`  ${C.dim}${"─".repeat(colW.provider + colW.model + colW.status + colW.time + colW.detail + 13)}${C.reset}`);
    console.log(`  ${C.bold}${pad("Provider", colW.provider)}│ ${pad("Modello", colW.model)}│ ${pad("Esito", colW.status)}│ ${pad("Tempo", colW.time)}│ ${pad("Dettaglio", colW.detail)}${C.reset}`);
    console.log(`  ${C.dim}${"─".repeat(colW.provider + colW.model + colW.status + colW.time + colW.detail + 13)}${C.reset}`);
  }

  printHeader();

  for (const provider of IMPLEMENTED_CLIENTS) {
    const config = PROVIDER_CONFIGS[provider];
    const providerData = db?.providers?.[provider];
    const apiKey = providerData?.keys?.[0]?.key || null;

    if (!apiKey) {
      console.log(`  ${pad(provider, colW.provider)}│ ${pad("(nessuna chiave)", colW.model)}│ ${C.yellow}${pad("SKIP", colW.status)}${C.reset}│ ${pad("-", colW.time)}│ ${pad("Nessuna API key disponibile", colW.detail)}`);
      totalSkip++;
      continue;
    }

    const models = await loadModels(provider);
    if (models.length === 0) {
      console.log(`  ${pad(provider, colW.provider)}│ ${pad("(nessun modello)", colW.model)}│ ${C.yellow}${pad("SKIP", colW.status)}${C.reset}│ ${pad("-", colW.time)}│ ${pad("File modelli non trovato o vuoto", colW.detail)}`);
      totalSkip++;
      continue;
    }

    for (const model of models) {
      const result = await testModel(provider, model, apiKey, config);
      if (result.ok) {
        totalOk++;
        console.log(`  ${pad(provider, colW.provider)}│ ${pad(model, colW.model)}│ ${C.green}${pad("OK", colW.status)}${C.reset}│ ${pad(result.elapsed + "s", colW.time)}│ ${C.dim}${pad(result.preview || "", colW.detail)}${C.reset}`);
      } else {
        totalErr++;
        console.log(`  ${pad(provider, colW.provider)}│ ${pad(model, colW.model)}│ ${C.red}${pad("ERR", colW.status)}${C.reset}│ ${pad(result.elapsed + "s", colW.time)}│ ${C.red}${pad((result.error || "").substring(0, colW.detail), colW.detail)}${C.reset}`);
      }
    }
  }

  console.log(`  ${C.dim}${"─".repeat(colW.provider + colW.model + colW.status + colW.time + colW.detail + 13)}${C.reset}`);
  const total = totalOk + totalErr + totalSkip;
  const statusColor = totalErr === 0 ? C.green : C.red;
  console.log(`\n  ${C.bold}Riepilogo:${C.reset} ${total} test · ${C.green}${totalOk} OK${C.reset} · ${C.red}${totalErr} ERR${C.reset} · ${C.yellow}${totalSkip} SKIP${C.reset}${statusColor}\n`);

  process.exit(totalErr > 0 ? 1 : 0);
}

main();
