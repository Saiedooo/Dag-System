const mongoose = require('mongoose');

// Set bufferCommands globally before any connection attempts
mongoose.set('bufferCommands', true);
mongoose.set('bufferMaxEntries', 0); // Disable buffering limit

const dbConnection = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('Missing DB_URL in environment');
    process.exit(1);
  }

  // Check if already connected (important for Vercel serverless)
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    const conn = await mongoose.connect(dbUrl, {
      // Serverless-friendly connection options
      bufferCommands: true, // Enable buffering for serverless (commands wait for connection)
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`✅ Database Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);

    // Verify connection is ready
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connection is ready');
    } else {
      console.warn(
        '⚠️ MongoDB connection state:',
        mongoose.connection.readyState
      );
    }
  } catch (err) {
    console.error('❌ Database Connection Error:', err.message || err);
    // ensure process exits so nodemon doesn't keep app running in bad state
    process.exit(1);
  }
};

module.exports = dbConnection;
