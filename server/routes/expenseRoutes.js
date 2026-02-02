const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');
const { getExpenses, createExpense, updateStatus, sendExpenseReport, exportExpensesCsv } = require('../controllers/expenseController');

router.get('/', auth, getExpenses);
router.post('/', auth, createExpense);
router.put('/approve/:id', [auth, roleCheck(['manager', 'admin'])], updateStatus);
router.post('/send-report', auth, sendExpenseReport);
router.get('/export/csv', auth, exportExpensesCsv);

module.exports = router;