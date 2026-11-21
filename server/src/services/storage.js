import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const storageFilePath = fileURLToPath(import.meta.url);
const storageDirectory = path.dirname(storageFilePath);
const DATA_FILE = path.join(storageDirectory, '../data/kaamsetu_db.json');

let inMemoryDb = {
  users: [],
  workerProfiles: [],
  employerProfiles: [],
  jobs: [],
  applications: [],
  skills: [],
  reviews: [],
  notifications: [],
  reports: []
};

export const initializeStorage = async () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      if (raw.trim().length > 0) {
        inMemoryDb = JSON.parse(raw);
        console.log(`[Storage] Loaded existing database with ${inMemoryDb.jobs.length} jobs, ${inMemoryDb.workerProfiles.length} workers.`);
        return;
      }
    }
    // If not existing, it will be populated by seedData
    saveStorage();
  } catch (err) {
    console.error('[Storage] Error loading data file, initializing empty state:', err.message);
  }
};

export const saveStorage = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving data file:', err.message);
  }
};

export const getDb = () => inMemoryDb;

export const setDb = (newDb) => {
  inMemoryDb = newDb;
  saveStorage();
};

export const findOne = (collection, filterFn) => {
  const coll = inMemoryDb[collection] || [];
  return coll.find(filterFn) || null;
};

export const find = (collection, filterFn) => {
  const coll = inMemoryDb[collection] || [];
  if (!filterFn) return [...coll];
  return coll.filter(filterFn);
};

export const insert = (collection, item) => {
  if (!inMemoryDb[collection]) inMemoryDb[collection] = [];
  const newItem = {
    _id: item._id || 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item
  };
  inMemoryDb[collection].push(newItem);
  saveStorage();
  return newItem;
};

export const update = (collection, id, updates) => {
  const coll = inMemoryDb[collection] || [];
  const index = coll.findIndex(item => item._id === id || item.id === id);
  if (index === -1) return null;
  coll[index] = {
    ...coll[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  saveStorage();
  return coll[index];
};

export const remove = (collection, id) => {
  const coll = inMemoryDb[collection] || [];
  const index = coll.findIndex(item => item._id === id || item.id === id);
  if (index === -1) return false;
  coll.splice(index, 1);
  saveStorage();
  return true;
};
