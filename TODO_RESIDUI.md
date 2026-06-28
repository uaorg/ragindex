# Interventi Residui — ✅ COMPLETATI

| # | Intervento | Priorità | Stato |
|---|-----------|----------|-------|
| 2 | `initConfig()` ridondante a ogni conversazione | Media | ✅ |
| 3 | Hot-swap client silenzioso (updateClient non notifica ragEngine) | Media | ✅ |
| 4 | `_SUPPORTED_PROVIDERS` statico non allineato ai provider reali | Bassa | ✅ |
| 5 | Provider con chiavi ma senza client (nvidia, deepseek, qwen, zhipuai, opencode) | Bassa | ✅ |
| 6 | Chiavi default solo offuscate, non cifrate | Bassa | ✅ |

## Dettaglio Interventi

### #2 — initConfig ridondante
- Aggiunto flag `_configLoaded` in `app_mgr.js`
- `initConfig()` ritorna immediatamente se già caricato
- Aggiunto `resetConfig()` per forzare ricarica quando necessario

### #3 — Hot-swap client silenzioso
- `updateClient()` in `llm_provider.js` chiama `AppMgr.resetConfig()` con dynamic import se è il provider attivo
- La prossima conversazione invocherà `initConfig()` che ricarica il client fresco

### #4 — _SUPPORTED_PROVIDERS dinamico
- Sostituita costante statica con funzione `_getSupportedProviders()` in `key_retriever.js`
- Legge da `_PROVIDER_CONFIG` via `getProviderConfig()` con dynamic import
- Fallback a `["gemini", "mistral"]` se non ancora caricato

### #5 — Provider senza client
- Aggiunta whitelist `_IMPLEMENTED_CLIENTS` in `key_retriever.js`
- `_loadDefaultKeys()` filtra via i provider senza client prima di salvare (nvidia, deepseek, qwen, zhipuai, opencode)

### #6 — Chiavi offuscate
- Aggiunto JSDoc su `decodeApiKeysJson()` con nota esplicativa sul gap di sicurezza
- Nessuna modifica all'algoritmo