const mongoose = require('mongoose');

const dbConnection = async () => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('Missing DB_URL in environment');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(dbUrl);
    console.log(`Database Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('Database Connection Error:', err.message || err);
    // ensure process exits so nodemon doesn't keep app running in bad state
    process.exit(1);
  }
};

module.exports = dbConnection;
