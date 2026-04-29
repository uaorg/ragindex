/**
 * @fileoverview data_repository.js - Layer di astrazione per il database.
 * Fornisce un'interfaccia singola per interagire con i dati dell'applicazione,
 * isolando la logica di persistenza (IndexedDB/Dexie) dalla logica di business.
 * @module services/data_repository
 */

import { idbMgr, UaDb } from "./idb_mgr.js";

export const DataRepository = {
    // --- Documenti e Knowledge Base ---
    async saveDoc(id, content) { 
        return await idbMgr.create(id, content); 
    },
    
    async getDoc(id) { 
        return await idbMgr.read(id); 
    },
    
    async deleteDoc(id) { 
        return await idbMgr.delete(id); 
    },

    async getAllDocs() {
        return await idbMgr.getAllRecords();
    },

    // --- Configurazioni e Impostazioni ---
    async getSetting(key) { 
        return await UaDb.read(key); 
    },
    
    async saveSetting(key, val) { 
        await UaDb.save(key, val); 
    },

    async deleteSetting(key) {
        await UaDb.delete(key);
    },

    // --- Utility Operative ---
    async clearAllData() { 
        return await idbMgr.clearAll(); 
    }
};
