const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const dbConnection = require('./config/database.js');
const globalError = require('./middleware/errorMiddleware');

const userRoute = require('./Routes/userRoute.js');
const authRoute = require('./Routes/authRoute.js');
const complaintRoute = require('./Routes/complaintRoute.js');
const invoiceRoute = require('./Routes/invoiceRoute.js');
const customerRoute = require('./Routes/customerRoute.js');
const dailyInquiryRoute = require('./Routes/dailyInquiryRoute.js');
const stateRoute = require('./Routes/stateRoute.js');

dotenv.config();

// handle synchronous exceptions as early as possible
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err?.name, err?.message);
  process.exit(1);
});

// express app
const app = express();

// Enable CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
  })
);

// مهم جدًا: إيقاف الـ Caching تمامًا لكل الـ API
app.use('/api/v1', (req, res, next) => {
  // منع أي نوع من الـ caching سواء في المتصفح أو في CDN زي Vercel
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, private'
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// parse JSON bodies
app.use(express.json({ limit: '50mb' })); // زيادة الحجم لو فيه CSV كبير

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// connect to database
dbConnection().catch((err) => {
  console.error('Failed to connect to database:', err);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
});

// Routes
app.use('/api/data', stateRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/complaint', complaintRoute);
app.use('/api/v1/invoices', invoiceRoute);
app.use('/api/v1/customers', customerRoute);
app.use('/api/v1/daily-inquiries', dailyInquiryRoute);
app.use('/api/v1/dailyFeedbacks', require('./Routes/dailyFeedbackRoutes'));
app.use(
  '/api/v1/daily-feedback-tasks',
  require('./Routes/dailyFeedbackTaskRoutes')
);

// Global error handler
app.use(globalError);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err?.name} | ${err?.message}`);
  if (server && server.close) {
    server.close(() => {
      console.error('Shutting down....');
      process.exit(1);
    });
    setTimeout(() => process.exit(1), 5000);
  } else {
    process.exit(1);
  }
});

// Local development server
let server;
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
