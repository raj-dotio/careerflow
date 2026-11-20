import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careerflow';
    
    const conn = await mongoose.connect(mongoURI);

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] MongoDB connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database] MongoDB disconnected`);
    });
  } catch (error) {
    console.error(`[Database] Failed to connect to MongoDB:`, error);
    process.exit(1);
  }
};
