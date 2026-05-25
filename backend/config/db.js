const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to fix SRV lookup issues on some networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.error('Server will continue running. Check your MongoDB connection string and network.');
  }
};

module.exports = connectDB;
