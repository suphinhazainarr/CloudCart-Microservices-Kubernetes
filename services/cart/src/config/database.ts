import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, { dbName: 'cloudcart' });
    console.warn(`[cart] MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('[cart] MongoDB connection failed:', error);
    process.exit(1);
  }
};
