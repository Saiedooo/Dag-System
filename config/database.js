const mongoose = require('mongoose');

const dbConnection = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('Missing DB_URL in environment');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(dbUrl, {
      // Ensure connection options for persistent storage
      bufferCommands: false,
      maxPoolSize: 10,
    });
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);
    
    // Verify connection is ready
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection is ready');
    } else {
      console.warn('⚠️ MongoDB connection state:', mongoose.connection.readyState);
    }
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message || err);
    // ensure process exits so nodemon doesn't keep app running in bad state
    process.exit(1);
  }
};

module.exports = dbConnection;
