# Guida allo Sviluppo Locale

Questa guida spiega come configurare l'ambiente di sviluppo locale per RagIndex, in particolare la gestione del sistema di login e della telemetria (sender).

## Configurazione Centralizzata

Tutte le impostazioni di sviluppo si trovano nel file:
`static/js/services/config.js`

Il sistema rileva automaticamente se l'applicazione è in esecuzione in un ambiente locale (localhost, 127.0.0.1 o file://).

---

## 1. Gestione Login (Bypass Google)

Per velocizzare lo sviluppo ed evitare di dover effettuare il login Google ad ogni sessione o refresh, è possibile attivare il bypass locale.

### Come attivarlo/disattivarlo
Nel file `static/js/services/config.js`, modifica la costante `DISABLE_LOGIN_ON_LOCAL`:

*   **`true` (Default Sviluppo)**: Se accedi da localhost, il login Google viene saltato. Ti verrà assegnato automaticamente l'utente `user_local`.
*   **`false`**: Il login Google è obbligatorio anche in locale. Utile per testare il flusso di autenticazione reale.

### Come funziona
La guardia di sicurezza in `static/index.html` controlla questa variabile. Se il bypass è attivo, non verrai reindirizzato a `login.html`. Il servizio `webuser_id.js` genererà l'identità locale necessaria per il funzionamento dell'app.

---

## 2. Gestione Telemetria (Sender Analytics)

Il sistema invia eventi (come la creazione di una KB o l'inizio di una chat) a un worker esterno per scopi di analisi. Di default, questo comportamento è disabilitato in locale.

### Come attivarlo/disattivarlo
Nel file `static/js/services/config.js`, modifica la costante `DISABLE_SENDER_ON_LOCAL`:

*   **`true` (Default Sviluppo)**: Nessun evento viene inviato al worker quando sei in locale. Vedrai un log nella console: `UaSender.sendEventAsync: invio saltato (ambiente locale)`.
*   **`false`**: Gli eventi vengono inviato al worker anche da localhost. Utile per testare l'integrazione della telemetria.

---

## Riepilogo Variabili di Configurazione

| Variabile | Scopo | Valore Consigliato (Sviluppo) |
| :--- | :--- | :--- |
| `DISABLE_LOGIN_ON_LOCAL` | Salta Google Login in locale | `true` |
| `LOCAL_USER_ID` | ID assegnato in bypass locale | `"user_local"` |
| `DISABLE_SENDER_ON_LOCAL` | Blocca invio analytics in locale | `true` |

**Nota**: Queste impostazioni **non hanno effetto** quando l'applicazione viene distribuita su un dominio pubblico (produzione), garantendo che il login rimanga obbligatorio e la telemetria attiva per gli utenti finali.
o pubblico (produzione), garantendo che il login rimanga obbligatorio e la telemetria attiva per gli utenti finali.
