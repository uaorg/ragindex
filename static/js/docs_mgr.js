/**
 * @fileoverview docs_mgr.js - Gestore documenti dell'applicazione
 * @description Fornisce funzioni per gestire documenti caricati dall'utente.
 *              Modulo specifico dell'applicazione RagIndex.
 * @module docs_mgr
 */
"use strict";

import { DataRepository } from "./services/data_repository.js";
import { DATA_KEYS } from "./services/data_keys.js";

// ============================================================================
// VARIABILI PRIVATE
// ============================================================================

let _names = [];

const _init = async () => {
    const data = await DataRepository.getSetting(DATA_KEYS.KEY_DOCS);
    _names = data ? JSON.parse(data) : [];
};

// ============================================================================
// API PUBBLICA
// ============================================================================

export const DocsMgr = {

    init: async () => await _init(),

    add: async (name, doc) => {
        await _init();

        if (!_names.includes(name)) {
            _names.push(name);
            await DataRepository.saveSetting(DATA_KEYS.KEY_DOCS, JSON.stringify(_names));
        }

        await DataRepository.saveDoc(`${DATA_KEYS.KEY_DOC_PRE}${name}`, doc);
    },

    read: async (name) => {
        return await DataRepository.getDoc(`${DATA_KEYS.KEY_DOC_PRE}${name}`);
    },

    names: async () => {
        await _init();
        return _names;
    },

    getAll: async () => {
        await _init();
        return await Promise.all(_names.map(async (name) => ({
            name,
            text: await DocsMgr.read(name)
        })));
    },

    name: async (i) => {
        await _init();
        return (i >= 0 && i < _names.length) ? _names[i] : null;
    },

    doc: async (i) => {
        const name = await DocsMgr.name(i);
        return name ? await DocsMgr.read(name) : null;
    },

    delete: async (name) => {
        await _init();
        const index = _names.indexOf(name);
        if (index > -1) {
            _names.splice(index, 1);
            await DataRepository.saveSetting(DATA_KEYS.KEY_DOCS, JSON.stringify(_names));
            await DataRepository.deleteDoc(`${DATA_KEYS.KEY_DOC_PRE}${name}`);
            return true;
        }
        return false;
    },

    deleteAll: async () => {
        await _init();
        for (const name of _names) {
            await DataRepository.deleteDoc(`${DATA_KEYS.KEY_DOC_PRE}${name}`);
        }
        _names = [];
        await DataRepository.saveSetting(DATA_KEYS.KEY_DOCS, JSON.stringify([]));
    },

    exists: async (name) => {
        await _init();
        return _names.includes(name);
    }
};
