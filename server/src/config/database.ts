import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerflow';
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database] MongoDB disconnected`);
    });
  } catch (error: any) {
    console.warn(`[Database] Warning: Could not connect to MongoDB (${error?.message || error}). Running in stateless mode (ATS Diagnostics and stateless features remain fully operational).`);
  }
};
