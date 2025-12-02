const express = require('express');

const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../Services/invoiceService');

const authService = require('../Services/authServices');

const router = express.Router();

// Uncomment if you want to protect invoice routes
// router.use(authService.protect);
// router.use(authService.allowedTo('admin', 'manager'));

router
  .route('/')
  .get(getAllInvoices)
  .post(createInvoice);

router
  .route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(deleteInvoice);

module.exports = router;


