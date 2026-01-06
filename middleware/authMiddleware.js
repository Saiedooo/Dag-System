// middleware/authMiddleware.js
// Thin wrapper to expose auth functions as middleware
const { protect, allowedTo } = require('../Services/authServices');

module.exports = {
  protect,
  allowedTo,
};
