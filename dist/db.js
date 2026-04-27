import mongoose from 'mongoose';
import { env } from './config.js';
let isConnected = false;
export const connectDatabase = async () => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    await mongoose.connect(env.MONGODB_URI, {
        dbName: env.MONGODB_DB_NAME
    });
    isConnected = true;
    return mongoose.connection;
};
export const getDb = () => {
    if (mongoose.connection.readyState !== 1) {
        throw new Error('Database is not initialized. Call connectDatabase first.');
    }
    return mongoose.connection;
};
export const closeDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        return;
    }
    await mongoose.disconnect();
    isConnected = false;
};
