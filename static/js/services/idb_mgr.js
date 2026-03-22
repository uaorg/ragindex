/**
 * @fileoverview idb_mgr.js - Gestore IndexedDB basato su Dexie.js
 * @description Fornisce un'interfaccia semplificata per operazioni CRUD
 *              su IndexedDB utilizzando Dexie.js come motore sottostante.
 * @module services/idb_mgr
 */
"use strict";

import Dexie from "./vendor/dexie.js";

// ============================================================================
// CONFIGURAZIONE DATABASE
// ============================================================================

const _db = new Dexie("RagIndexDB");

_db.version(2).stores({
    kvStore: "id",
    settings: "id"
});

// ============================================================================
// FUNZIONI DI SUPPORTO (Private)
// ============================================================================

const _logErr = (op, err) => { 
    console.error(`Dexie [${op}]:`, err); 
    return false; 
};

// ============================================================================
// API PUBBLICA - idbMgr (Tabella kvStore)
// ============================================================================

export const idbMgr = {
    db: () => _db,

    create: async (key, val) => { 
        try { await _db.kvStore.put({ id: key, value: val }); return true; } 
        catch (e) { return _logErr("create", e); } 
    },

    read: async (key) => { 
        try { const r = await _db.kvStore.get(key); return r ? r.value : undefined; } 
        catch (e) { _logErr("read", e); return undefined; } 
    },

    update: async (key, val) => await idbMgr.create(key, val),

    delete: async (key) => { 
        try { await _db.kvStore.delete(key); return true; } 
        catch (e) { return _logErr("delete", e); } 
    },

    exists: async (key) => { 
        try { return await _db.kvStore.where("id").equals(key).count() > 0; } 
        catch (e) { return _logErr("exists", e); } 
    },

    getAllKeys: async () => { 
        try { return await _db.kvStore.toCollection().primaryKeys(); } 
        catch (e) { return _logErr("getAllKeys", e) || []; } 
    },

    selectKeys: async (prefix) => { 
        try { return await _db.kvStore.where("id").startsWith(prefix).primaryKeys(); } 
        catch (e) { return _logErr("selectKeys", e) || []; } 
    },

    getAllRecords: async () => { 
        try { 
            const all = await _db.kvStore.toArray(); 
            return all.map(r => ({ key: r.id, value: r.value })); 
        } catch (e) { return _logErr("getAllRecords", e) || []; } 
    },

    selectRecords: async (prefix) => { 
        try { 
            const found = await _db.kvStore.where("id").startsWith(prefix).toArray(); 
            return found.map(r => ({ key: r.id, value: r.value })); 
        } catch (e) { return _logErr("selectRecords", e) || []; } 
    },

    clearAll: async () => { 
        try { await Promise.all(_db.tables.map(t => t.clear())); return true; } 
        catch (e) { return _logErr("clearAll", e); } 
    }
};

// ============================================================================
// API PUBBLICA - UaDb (Tabella settings)
// ============================================================================

export const UaDb = {
    read: async (id) => {
        try { const r = await _db.settings.get(id); return r ? r.value : ""; }
        catch (e) { return _logErr(`UaDb.read:${id}`, e) || ""; }
    },

    delete: async (id) => {
        try { await _db.settings.delete(id); }
        catch (e) { _logErr(`UaDb.delete:${id}`, e); }
    },

    save: async (id, data) => {
        try { await _db.settings.put({ id, value: data }); }
        catch (e) { _logErr(`UaDb.save:${id}`, e); }
    },

    getAllIds: async () => {
        try { return await _db.settings.toCollection().primaryKeys(); }
        catch (e) { return _logErr("UaDb.getAllIds", e) || []; }
    },

    saveArray: async (id, arr) => await UaDb.save(id, JSON.stringify(arr)),

    readArray: async (id) => {
        const str = await UaDb.read(id);
        try { return str ? JSON.parse(str) : []; }
        catch (e) { return _logErr("UaDb.readArray", e) || []; }
    },

    saveJson: async (id, js) => await UaDb.save(id, JSON.stringify(js)),

    readJson: async (id) => {
        const str = await UaDb.read(id);
        try { return str ? JSON.parse(str) : {}; }
        catch (e) { return _logErr("UaDb.readJson", e) || {}; }
    },

    clear: async () => {
        try { await _db.settings.clear(); }
        catch (e) { _logErr("UaDb.clear", e); }
    }
};
