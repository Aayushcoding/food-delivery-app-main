const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = 'mongodb://127.0.0.1:27017/food-delivery';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000
    });
    const conn = mongoose.connection;
    console.log(`✅ MongoDB connected: ${conn.host}:${conn.port}/${conn.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('   Make sure MongoDB is running: mongod --dbpath C:\\data\\db');
    process.exit(1);
  }
};

module.exports = connectDB;