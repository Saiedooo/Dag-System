const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const dbConnection = require('./config/database.js');
const globalError = require('./middleware/errorMiddleware');

const userRoute = require('./Routes/userRoute.js');
const authRoute = require('./Routes/authRoute.js');
const complaintRoute = require('./Routes/complaintRoute.js');
const stateRoute = require('./Routes/stateRoute.js');

dotenv.config();

// handle synchronous exceptions as early as possible
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err?.name, err?.message);
  process.exit(1);
});

// express app
const app = express();

// parse JSON bodies
app.use(express.json());

// Enable other domains to access your application
app.use(cors());
// app.options('*', cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

app.use('/api/data', stateRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/complaint', complaintRoute);

// connect to database
dbConnection();

app.use(globalError);

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
});

// Handle rejection outside express
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err?.name} | ${err?.message}`);
  if (server && server.close) {
    server.close(() => {
      console.error('Shutting down....');
      process.exit(1);
    });
    // force exit in case server.close hangs
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});
