import mongoose from 'mongoose';

let isConnected = false; //Prevent multiple connections

const connectDB = async () => {
  if (isConnected) {
    console.log('⚡ Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'users', // ✅ database name
    });
    isConnected = true;
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;
