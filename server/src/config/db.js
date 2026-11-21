import mongoose from 'mongoose';
import { initializeStorage } from '../services/storage.js';

let isMongooseConnected = false;

export const connectDB = async () => {
  // If explicitly DEMO_MODE or MongoDB not available, quickly use local persistent storage
  if (process.env.DEMO_MODE === 'true' && !process.env.FORCE_MONGO) {
    console.log(`[Database] DEMO_MODE is active. Initializing persistent local database.`);
    await initializeStorage();
    return false;
  }

  try {
    const uri = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://localhost:27017/kaamsetu');
    if (!uri) {
      throw new Error('MONGODB_URI is required in production. Add it to your Netlify environment variables.');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isMongooseConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);

    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn('[Database] Using local demo storage.');
    isMongooseConnected = false;
    await initializeStorage();
    return false;
  }
};

export const getDbStatus = () => ({
  mode: isMongooseConnected ? 'mongodb' : 'local_storage_demo',
  connected: isMongooseConnected,
  provider: isMongooseConnected ? 'MongoDB / Mongoose' : 'Local JSON Persistent Store'
});
