import mongoose from 'mongoose';
import { env } from './config.js';

let isConnected = false;

export const connectDatabase = async (): Promise<typeof mongoose.connection> => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME
  });

  isConnected = true;
  return mongoose.connection;
};

export const getDb = (): typeof mongoose.connection => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not initialized. Call connectDatabase first.');
  }

  return mongoose.connection;
};

export const closeDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
};
