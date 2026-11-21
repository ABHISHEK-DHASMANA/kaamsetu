import mongoose from 'mongoose';
import { initializeStorage, getDb } from '../services/storage.js';
import { generateSeedData } from '../seeds/seedData.js';

let isMongooseConnected = false;

// The current API controllers read from the JSON storage service.
// Initialize it even when MongoDB connects, then seed the demo dataset once
// when the store is empty so the one-click demo accounts are available.
const initializeAppStorage = async () => {
  await initializeStorage();

  if (!getDb().users?.length) {
    console.log('[Database] Empty application store detected. Creating demo dataset...');
    await generateSeedData();
    await initializeStorage();
  }

  const db = getDb();
  console.log(
    `[Database] Application storage ready: ${db.users?.length || 0} users, ${db.workerProfiles?.length || 0} workers, ${db.employerProfiles?.length || 0} employers.`
  );
};

export const connectDB = async () => {
  // If explicitly DEMO_MODE or MongoDB not available, use local JSON storage.
  if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV !== 'production' && !process.env.FORCE_MONGO) {
    console.log('[Database] DEMO_MODE is active.');
    await initializeAppStorage();
    return false;
  }

  try {
    const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://localhost:27017/kaamsetu');
    if (!uri) {
      throw new Error('MONGODB_URI is required in production. Configure it in the backend environment.');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isMongooseConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    // The existing controllers use services/storage.js, so prepare that store too.
    await initializeAppStorage();
    return true;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);

    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn('[Database] Using local demo storage.');
    isMongooseConnected = false;
    await initializeAppStorage();
    return false;
  }
};

export const getDbStatus = () => ({
  mode: isMongooseConnected ? 'mongodb + application JSON store' : 'local_storage_demo',
  connected: isMongooseConnected,
  provider: isMongooseConnected ? 'MongoDB / Mongoose + JSON application store' : 'Local JSON Store'
});
