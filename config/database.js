const mongoose = require('mongoose');

// Set bufferCommands globally before any connection attempts
mongoose.set('bufferCommands', true);

const dbConnection = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    const msg = 'Missing DB_URL in environment';
    console.error(msg);
    // In serverless environments (Vercel) calling process.exit will terminate the function unexpectedly.
    // Throw instead so the caller/middleware can handle the error and return a proper HTTP response.
    throw new Error(msg);
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
    // Throw the error so serverless platforms can return a proper error response
    throw err;
  }
};

module.exports = dbConnection;
