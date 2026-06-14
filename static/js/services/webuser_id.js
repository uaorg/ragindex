

import { DATA_KEYS } from './data_keys.js';
import { DISABLE_LOGIN_ON_LOCAL, LOCAL_USER_ID, isLocalEnvironment } from './config.js';

/**
 * Costante per il valore di fallback (guest).
 */
const GUEST_USER_ID = "ragindex_guest";

export const WebId = (() => {
    const storageKey = DATA_KEYS.KEY_WEB_ID;

    const get = () => {
        // Se siamo in locale e il bypass è attivo, forziamo l'utente locale
        if (DISABLE_LOGIN_ON_LOCAL && isLocalEnvironment()) {
            return LOCAL_USER_ID;
        }

        let userId = localStorage.getItem(storageKey);
        if (!userId) {
            userId = `${GUEST_USER_ID}_${Date.now()}`;
            // Non salviamo il guest temporaneo nel localStorage per non "sporcarlo"
            // se non esplicitamente richiesto, ma lo restituiamo.
        }
        return userId;
    };

    const clear = () => {
        localStorage.removeItem(storageKey);
    };

    return {
        get,
        clear
    };
})();
