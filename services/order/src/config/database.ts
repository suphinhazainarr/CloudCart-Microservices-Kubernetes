import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'cloudcart',
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    console.warn(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
