/**
 * @fileoverview idb_mgr.js - Gestore IndexedDB basato su Dexie.js
 * @description Fornisce un'interfaccia semplificata per operazioni CRUD
 *              su IndexedDB utilizzando Dexie.js come motore sottostante.
 * @module services/idb_mgr
 */
"use strict";

import Dexie from "./vendor/dexie.js";
import { WebId } from "./webuser_id.js";

// ============================================================================
// CONFIGURAZIONE DATABASE
// ============================================================================

/** 
 * Il nome del database include l'ID utente per garantire l'isolamento dei dati
 * tra account diversi sullo stesso browser.
 */
const userId = WebId.get();
const _db = new Dexie(`RagIndexDB_${userId}`);

_db.version(2).stores({
    kvStore: "id",
    settings: "id"
});

// ============================================================================
// FUNZIONI DI SUPPORTO (Private)
// ============================================================================

/**
 * Log degli errori Dexie.
 * @param {string} op  - Operazione fallita.
 * @param {Error}  err - Oggetto errore.
 * @returns {boolean} Sempre false.
 */
const _logErr = function(op, err) { 
    console.error(`idbMgr.${op}:`, err); 
    return false; 
};

// ============================================================================
// API PUBBLICA - idbMgr (Tabella kvStore)
// ============================================================================

export const idbMgr = {
    db: () => _db,

    create: async function(key, val) { 
        if (!key) {
            console.error("idbMgr.create: key mancante");
            return false;
        }

        let success = false;
        try { 
            await _db.kvStore.put({ id: key, value: val }); 
            success = true; 
        } catch (e) { 
            success = _logErr("create", e); 
        } 
        return success;
    },

    read: async function(key) { 
        if (!key) {
            console.error("idbMgr.read: key mancante");
            return undefined;
        }

        let result = undefined;
        try { 
            const record = await _db.kvStore.get(key); 
            if (record) {
                result = record.value;
            }
        } catch (e) { 
            _logErr("read", e); 
            result = undefined;
        } 
        return result;
    },

    update: async function(key, val) { 
        const result = await idbMgr.create(key, val);
        return result;
    },

    delete: async function(key) { 
        if (!key) {
            console.error("idbMgr.delete: key mancante");
            return false;
        }

        let success = false;
        try { 
            await _db.kvStore.delete(key); 
            success = true;
        } catch (e) { 
            success = _logErr("delete", e); 
        } 
        return success;
    },

    exists: async function(key) { 
        if (!key) {
            console.error("idbMgr.exists: key mancante");
            return false;
        }

        let exists = false;
        try { 
            const count = await _db.kvStore.where("id").equals(key).count();
            exists = count > 0;
        } catch (e) { 
            exists = _logErr("exists", e); 
        } 
        return exists;
    },

    getAllKeys: async function() { 
        let keys = [];
        try { 
            keys = await _db.kvStore.toCollection().primaryKeys(); 
        } catch (e) { 
            _logErr("getAllKeys", e);
            keys = [];
        } 
        return keys;
    },

    selectKeys: async function(prefix) { 
        let keys = [];
        try { 
            keys = await _db.kvStore.where("id").startsWith(prefix).primaryKeys(); 
        } catch (e) { 
            _logErr("selectKeys", e); 
            keys = [];
        } 
        return keys;
    },

    getAllRecords: async function() { 
        let records = [];
        try { 
            const all = await _db.kvStore.toArray(); 
            records = all.map(r => ({ key: r.id, value: r.value })); 
        } catch (e) { 
            _logErr("getAllRecords", e);
            records = [];
        } 
        return records;
    },

    selectRecords: async function(prefix) { 
        let records = [];
        try { 
            const found = await _db.kvStore.where("id").startsWith(prefix).toArray(); 
            records = found.map(r => ({ key: r.id, value: r.value })); 
        } catch (e) { 
            _logErr("selectRecords", e);
            records = [];
        } 
        return records;
    },

    clearAll: async function() { 
        let success = false;
        try { 
            await Promise.all(_db.tables.map(t => t.clear())); 
            success = true;
        } catch (e) { 
            success = _logErr("clearAll", e); 
        } 
        return success;
    }
};

// ============================================================================
// API PUBBLICA - UaDb (Tabella settings)
// ============================================================================

export const UaDb = {
    read: async function(id) {
        let result = "";

        try {
            const r = await _db.settings.get(id);

            if (r) {
                result = r.value;
            }
        } catch (e) {
            _logErr(`UaDb.read:${id}`, e);
            result = "";
        }

        return result;
    },

    delete: async function(id) {
        try {
            await _db.settings.delete(id);
        } catch (e) {
            _logErr(`UaDb.delete:${id}`, e);
        }
    },

    save: async function(id, data) {
        try {
            await _db.settings.put({ id, value: data });
        } catch (e) {
            _logErr(`UaDb.save:${id}`, e);
        }
    },

    getAllIds: async function() {
        let result = [];

        try {
            result = await _db.settings.toCollection().primaryKeys();
        } catch (e) {
            _logErr("UaDb.getAllIds", e);
            result = [];
        }

        return result;
    },

    saveArray: async function(id, arr) {
        const str = JSON.stringify(arr);
        await UaDb.save(id, str);
    },

    readArray: async function(id) {
        const str = await UaDb.read(id);

        if (!str) {
            return [];
        }

        let result = [];

        try {
            result = JSON.parse(str);
        } catch (e) {
            _logErr("UaDb.readArray", e);
            result = [];
        }

        return result;
    },

    saveJson: async function(id, js) {
        const str = JSON.stringify(js);
        await UaDb.save(id, str);
    },

    readJson: async function(id) {
        const str = await UaDb.read(id);

        if (!str) {
            return {};
        }

        let result = {};

        try {
            result = JSON.parse(str);
        } catch (e) {
            _logErr("UaDb.readJson", e);
            result = {};
        }

        return result;
    },

    clear: async function() {
        try {
            await _db.settings.clear();
        } catch (e) {
            _logErr("UaDb.clear", e);
        }
    }
};
