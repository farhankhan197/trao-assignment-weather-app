import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  // Reuse cached connection in serverless environments
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(uri);
    cachedConnection = conn;
    console.log('MongoDB connected');
    return conn;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err; // Don't process.exit in serverless
  }
};
