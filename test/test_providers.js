#!/usr/bin/env node
"use strict";

const fs = require("fs/promises");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const API_KEYS_PATH = path.join(PROJECT_ROOT, "static", "data", "api_x.json");
const MODELS_DIR = path.join(PROJECT_ROOT, "static", "data", "models");

async function discoverProviders() {
  const files = await fs.readdir(MODELS_DIR);
  return files
    .filter(f => f.endsWith(".txt"))
    .map(f => f.replace(/\.txt$/, ""));
}

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
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { ok: false, elapsed, error: err.name === "AbortError" ? "Timeout (30s)" : err.message };
  } finally {
    clearTimeout(timeoutId);
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
  const failures = [];
  const htmlResults = [];

  const colW = { provider: 11, model: 28, status: 4, time: 6, detail: 45 };
  const LINE_W = 10 + colW.provider + colW.model + colW.status + colW.time + colW.detail;

  function printHeader() {
    console.log(`  ${C.dim}${"─".repeat(LINE_W - 2)}${C.reset}`);
    console.log(`  ${C.bold}${pad("Provider", colW.provider)}│ ${pad("Modello", colW.model)}│ ${pad("Esito", colW.status)}│ ${pad("Tempo", colW.time)}│ ${pad("Dettaglio", colW.detail)}${C.reset}`);
    console.log(`  ${C.dim}${"─".repeat(LINE_W - 2)}${C.reset}`);
  }

  const providers = await discoverProviders();

  printHeader();

  for (const provider of providers) {
    const config = PROVIDER_CONFIGS[provider];
    if (!config) {
      console.log(`  ${pad(provider, colW.provider)}│ ${pad("(config sconosciuta)", colW.model)}│ ${C.yellow}${pad("SKIP", colW.status)}${C.reset}│ ${pad("-", colW.time)}│ ${pad("Provider non in PROVIDER_CONFIGS", colW.detail)}`);
      htmlResults.push({ provider, model: "(config sconosciuta)", status: "SKIP", elapsed: "-", detail: "Provider non in PROVIDER_CONFIGS" });
      totalSkip++;
      continue;
    }
    const providerData = db?.providers?.[provider];
    const apiKey = providerData?.keys?.[0]?.key || null;

    if (!apiKey) {
      console.log(`  ${pad(provider, colW.provider)}│ ${pad("(nessuna chiave)", colW.model)}│ ${C.yellow}${pad("SKIP", colW.status)}${C.reset}│ ${pad("-", colW.time)}│ ${pad("Nessuna API key disponibile", colW.detail)}`);
      htmlResults.push({ provider, model: "(nessuna chiave)", status: "SKIP", elapsed: "-", detail: "Nessuna API key disponibile" });
      totalSkip++;
      continue;
    }

    const models = await loadModels(provider);
    if (models.length === 0) {
      console.log(`  ${pad(provider, colW.provider)}│ ${pad("(nessun modello)", colW.model)}│ ${C.yellow}${pad("SKIP", colW.status)}${C.reset}│ ${pad("-", colW.time)}│ ${pad("File modelli non trovato o vuoto", colW.detail)}`);
      htmlResults.push({ provider, model: "(nessun modello)", status: "SKIP", elapsed: "-", detail: "File modelli non trovato o vuoto" });
      totalSkip++;
      continue;
    }

    for (const model of models) {
      const result = await testModel(provider, model, apiKey, config);
      if (result.ok) {
        totalOk++;
        console.log(`  ${pad(provider, colW.provider)}│ ${pad(model, colW.model)}│ ${C.green}${pad("OK", colW.status)}${C.reset}│ ${pad(result.elapsed + "s", colW.time)}│ ${C.dim}${pad(result.preview || "", colW.detail)}${C.reset}`);
        htmlResults.push({ provider, model, status: "OK", elapsed: result.elapsed + "s", detail: result.preview || "" });
      } else {
        totalErr++;
        const errMsg = result.error || "";
        failures.push({ provider, model, error: errMsg });
        console.log(`  ${pad(provider, colW.provider)}│ ${pad(model, colW.model)}│ ${C.red}${pad("ERR", colW.status)}${C.reset}│ ${pad(result.elapsed + "s", colW.time)}│ ${C.red}${pad(errMsg.substring(0, colW.detail), colW.detail)}${C.reset}`);
        htmlResults.push({ provider, model, status: "ERR", elapsed: result.elapsed + "s", detail: errMsg.substring(0, 70) });
      }
    }
  }

  console.log(`  ${C.dim}${"─".repeat(LINE_W - 2)}${C.reset}`);
  const total = totalOk + totalErr + totalSkip;
  const statusColor = totalErr === 0 ? C.green : C.red;
  console.log(`\n  ${C.bold}Riepilogo:${C.reset} ${total} test · ${C.green}${totalOk} OK${C.reset} · ${C.red}${totalErr} ERR${C.reset} · ${C.yellow}${totalSkip} SKIP${C.reset}`);

  if (failures.length > 0) {
    console.log(`\n  ${C.bold}Modelli falliti:${C.reset}`);
    for (const f of failures) {
      const shortErr = f.error.substring(0, 60);
      console.log(`  ${C.red}•${C.reset} ${f.provider}/${f.model} — ${shortErr}`);
    }
  }

  console.log("");

  const htmlReportPath = path.join(__dirname, "providers_report.html");
  await writeHtmlReport(htmlReportPath, htmlResults);

  process.exit(totalErr > 0 ? 1 : 0);
}

async function writeHtmlReport(filePath, results) {
  const total = results.length;
  const ok = results.filter(r => r.status === "OK").length;
  const err = results.filter(r => r.status === "ERR").length;
  const skip = results.filter(r => r.status === "SKIP").length;
  const ts = new Date().toISOString().replace("T", " ").substring(0, 19);

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function statusClass(s) {
    if (s === "OK")   return "ok";
    if (s === "ERR")  return "err";
    return "skip";
  }

  let rows = "";
  for (const r of results) {
    rows += `<tr class="${statusClass(r.status)}">
      <td class="p">${esc(r.provider)}</td>
      <td class="m">${esc(r.model)}</td>
      <td class="s"><span class="badge ${statusClass(r.status)}">${r.status}</span></td>
      <td class="t">${esc(r.elapsed)}</td>
      <td class="d">${esc(r.detail)}</td>
    </tr>\n`;
  }

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RagIndex — Provider Test Report</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #121212;
  color: #e0e0e0;
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}
h1 {
  font-size: 22px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 4px;
}
.sub {
  font-size: 13px;
  color: #888;
  margin-bottom: 24px;
}
.summary {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.summary .card {
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 14px 22px;
  min-width: 90px;
  text-align: center;
}
.summary .card .num {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
}
.summary .card .lbl {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  margin-top: 2px;
}
.card.total .num { color: #e0e0e0; }
.card.pass  .num { color: #66bb6a; }
.card.fail  .num { color: #ef5350; }
.card.skipc .num { color: #ffa726; }
table {
  width: 100%;
  border-collapse: collapse;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
}
th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid #2a2a2a;
  background: #1e1e1e;
}
td {
  padding: 10px 14px;
  font-size: 14px;
  border-bottom: 1px solid #252525;
}
tr:last-child td { border-bottom: none; }
td.p { color: #bbb; width: 11%; }
td.m { width: 28%; }
td.s { width: 5%; }
td.t { width: 7%; color: #888; }
td.d { color: #999; font-size: 13px; }
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.3px;
}
.badge.ok   { background: #1b5e20; color: #a5d6a7; }
.badge.err  { background: #b71c1c; color: #ef9a9a; }
.badge.skip { background: #e65100; color: #ffe0b2; }
tr.ok  td { background: transparent; }
tr.err td { background: rgba(239,83,80,0.06); }
tr.skip td { background: rgba(255,167,38,0.05); }
tr:hover td { background: rgba(255,255,255,0.03); }
</style>
</head>
<body>

<h1>RagIndex — Provider &amp; Model Test</h1>
<p class="sub">${ts} &middot; Report generato da test/test_providers.js</p>

<div class="summary">
  <div class="card total"><div class="num">${total}</div><div class="lbl">Totale</div></div>
  <div class="card pass"><div class="num">${ok}</div><div class="lbl">OK</div></div>
  <div class="card fail"><div class="num">${err}</div><div class="lbl">ERR</div></div>
  <div class="card skipc"><div class="num">${skip}</div><div class="lbl">SKIP</div></div>
</div>

<table>
<thead>
<tr><th>Provider</th><th>Modello</th><th>Esito</th><th>Tempo</th><th>Dettaglio</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

</body>
</html>`;

  await fs.writeFile(filePath, html, "utf-8");
  console.log(`  ${C.dim}Rapporto HTML: ${filePath}${C.reset}`);
}

main();
