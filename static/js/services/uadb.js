/** @format */
"use strict";

import { idbMgr } from "./idb_mgr.js";

export const UaDb = {
  async read(id) {
    let result = "";

    try {
      const db = idbMgr.db();
      const record = await db.settings.get(id);

      if (record) {
        result = record.value;
      }
    } catch (error) {
      console.error(`Dexie UaDb: Errore lettura ${id}:`, error);
      result = "";
    }

    return result;
  },

  async delete(id) {
    try {
      const db = idbMgr.db();
      await db.settings.delete(id);
    } catch (error) {
      console.error(`Dexie UaDb: Errore eliminazione ${id}:`, error);
    }
  },

  async save(id, data) {
    try {
      const db = idbMgr.db();
      await db.settings.put({ id: id, value: data });
    } catch (error) {
      console.error(`Dexie UaDb: Errore salvataggio ${id}:`, error);
    }
  },

  async getAllIds() {
    let result = [];

    try {
      const db = idbMgr.db();
      result = await db.settings.toCollection().primaryKeys();
    } catch (error) {
      console.error("UaDb.getAllIds:", error);
      result = [];
    }

    return result;
  },

  async saveArray(id, arr) {
    const str = JSON.stringify(arr);
    await this.save(id, str);
  },

  async readArray(id) {
    const str = await this.read(id);

    if (!str || str.trim().length === 0) {
      return [];
    }

    let result = [];

    try {
      result = JSON.parse(str);
    } catch (e) {
      console.error("UaDb.readArray:", e);
      result = [];
    }

    return result;
  },

  async saveJson(id, js) {
    const str = JSON.stringify(js);
    await this.save(id, str);
  },

  async readJson(id) {
    const str = await this.read(id);

    if (!str) {
      return {};
    }

    let result = {};

    try {
      result = JSON.parse(str);
    } catch (e) {
      console.error("UaDb.readJson:", e);
      result = {};
    }

    return result;
  },

  async clear() {
    const db = idbMgr.db();
    await db.settings.clear();
  }
};
