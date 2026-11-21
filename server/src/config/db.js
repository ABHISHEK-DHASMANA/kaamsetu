import mongoose from 'mongoose';
import { initializeStorage, enableMongoPersistence, flushStorage, getDb, setDb } from '../services/storage.js';
import { generateSeedData } from '../seeds/seedData.js';

let isMongooseConnected = false;

const initializeAppStorage = async () => {
  await initializeStorage();

  if (!getDb().users?.length) {
    console.log('[Database] Empty application store detected. Creating demo dataset...');
    const seededDatabase = await generateSeedData();
    setDb(seededDatabase);
    await flushStorage();
  }

  const db = getDb();
  console.log(
    `[Database] Persistent application storage ready: ${db.users?.length || 0} users, ${db.workerProfiles?.length || 0} workers, ${db.employerProfiles?.length || 0} employers.`
  );
};

export const connectDB = async () => {
  if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && !process.env.FORCE_MONGO) {
    console.log('[Database] DEMO_MODE is active; using local development storage.');
    await initializeAppStorage();
    return false;
  }

  try {
    const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://localhost:27017/kaamsetu');
    if (!uri) {
      throw new Error('MONGODB_URI is required in production. Configure a persistent MongoDB database in the backend environment.');
    }

    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    isMongooseConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    const recordsCollection = mongoose.connection.collection('kaamsetu_records');
    await enableMongoPersistence(recordsCollection);
    await initializeAppStorage();
    await flushStorage();
    return true;
  } catch (error) {
    console.error('[Database] Persistent MongoDB connection failed:', error.message);
    isMongooseConnected = false;
    if (process.env.NODE_ENV === 'production') throw error;
    console.warn('[Database] Falling back to local development storage.');
    await initializeAppStorage();
    return false;
  }
};

export const getDbStatus = () => ({
  mode: isMongooseConnected ? 'mongodb_persistent' : 'local_storage_demo',
  connected: isMongooseConnected,
  provider: isMongooseConnected ? 'MongoDB persistent record store' : 'Local JSON development store'
});
