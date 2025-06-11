const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
      console.error('❌ MongoDB connection Error:', err.message);
      process.exit(1); 
    }
  }; 
  
  module.exports = connectDB;