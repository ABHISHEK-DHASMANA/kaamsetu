import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const storageFilePath = fileURLToPath(import.meta.url);
const storageDirectory = path.dirname(storageFilePath);
const DATA_FILE = path.join(storageDirectory, '../data/kaamsetu_db.json');

const emptyDatabase = () => ({
  users: [],
  workerProfiles: [],
  employerProfiles: [],
  jobs: [],
  applications: [],
  skills: [],
  reviews: [],
  notifications: [],
  reports: [],
  messages: [],
  savedJobs: [],
  userBlocks: [],
  payments: []
});

let inMemoryDb = emptyDatabase();
let mongoCollection = null;
let persistenceQueue = Promise.resolve();
let lastPersistenceError = null;

const clone = value => JSON.parse(JSON.stringify(value));
const recordId = item => String(item?._id || item?.id || '');
const mongoId = (collection, id) => `${collection}:${id}`;

const enqueuePersistence = operation => {
  if (!mongoCollection) return;
  const task = persistenceQueue.then(operation);
  persistenceQueue = task.catch(error => {
    lastPersistenceError = error;
    console.error('[Storage] MongoDB persistence failed:', error.message);
  });
};

const readLocalFile = () => {
  if (!fs.existsSync(DATA_FILE)) return false;
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  if (!raw.trim()) return false;
  const parsed = JSON.parse(raw);
  inMemoryDb = { ...emptyDatabase(), ...parsed };
  return true;
};

export const enableMongoPersistence = async collection => {
  if (!collection) throw new Error('A connected MongoDB collection is required.');
  mongoCollection = collection;

  const documents = await mongoCollection.find({}).toArray();
  if (documents.length) {
    const restored = emptyDatabase();
    for (const document of documents) {
      if (!restored[document.collection]) restored[document.collection] = [];
      if (document.data) restored[document.collection].push(document.data);
    }
    inMemoryDb = restored;
    console.log(`[Storage] Restored ${documents.length} records from persistent MongoDB storage.`);
    return;
  }

  // One-time migration for an existing local JSON database, if present.
  if (readLocalFile()) {
    const records = Object.entries(inMemoryDb).flatMap(([name, items]) =>
      items.map(item => ({
        _id: mongoId(name, recordId(item)),
        collection: name,
        data: item
      }))
    );
    if (records.length) await mongoCollection.insertMany(records, { ordered: true });
    console.log(`[Storage] Migrated ${records.length} existing local records to MongoDB.`);
  } else {
    inMemoryDb = emptyDatabase();
    console.log('[Storage] No existing records found in MongoDB; starting with an empty store.');
  }
};

export const initializeStorage = async () => {
  if (mongoCollection) return;
  try {
    readLocalFile();
    console.log(`[Storage] Local development store ready with ${inMemoryDb.jobs.length} jobs and ${inMemoryDb.workerProfiles.length} workers.`);
  } catch (err) {
    console.error('[Storage] Error loading local data file:', err.message);
    inMemoryDb = emptyDatabase();
  }
};

export const flushStorage = async () => {
  await persistenceQueue;
  if (lastPersistenceError) {
    const error = lastPersistenceError;
    lastPersistenceError = null;
    throw error;
  }
};

export const saveStorage = () => {
  if (mongoCollection) return;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving local data file:', err.message);
  }
};

export const getDb = () => inMemoryDb;

export const setDb = newDb => {
  inMemoryDb = { ...emptyDatabase(), ...newDb };
  if (!mongoCollection) {
    saveStorage();
    return;
  }
  enqueuePersistence(async () => {
    await mongoCollection.deleteMany({});
    const records = Object.entries(inMemoryDb).flatMap(([name, items]) =>
      items.map(item => ({
        _id: mongoId(name, recordId(item)),
        collection: name,
        data: clone(item)
      }))
    );
    if (records.length) await mongoCollection.insertMany(records, { ordered: true });
  });
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
  if (mongoCollection) {
    const snapshot = clone(newItem);
    enqueuePersistence(() => mongoCollection.replaceOne(
      { _id: mongoId(collection, recordId(snapshot)) },
      { _id: mongoId(collection, recordId(snapshot)), collection, data: snapshot },
      { upsert: true }
    ));
  } else {
    saveStorage();
  }
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
  if (mongoCollection) {
    const snapshot = clone(coll[index]);
    enqueuePersistence(() => mongoCollection.replaceOne(
      { _id: mongoId(collection, recordId(snapshot)) },
      { _id: mongoId(collection, recordId(snapshot)), collection, data: snapshot },
      { upsert: true }
    ));
  } else {
    saveStorage();
  }
  return coll[index];
};

export const remove = (collection, id) => {
  const coll = inMemoryDb[collection] || [];
  const index = coll.findIndex(item => item._id === id || item.id === id);
  if (index === -1) return false;
  const removed = coll.splice(index, 1)[0];
  if (mongoCollection) {
    enqueuePersistence(() => mongoCollection.deleteOne({
      _id: mongoId(collection, recordId(removed))
    }));
  } else {
    saveStorage();
  }
  return true;
};
