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

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaamsetu';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
    });
    isMongooseConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed (${error.message}).`);
    console.log(`[Database] Falling back to persistent local storage (Demo Mode).`);
    isMongooseConnected = false;
    await initializeStorage();
    return false;
  }
};

export const getDbStatus = () => ({
  mode: isMongooseConnected ? 'mongodb' : 'local_storage_demo',
  connected: true,
  provider: isMongooseConnected ? 'MongoDB / Mongoose' : 'Local JSON Persistent Store'
});
