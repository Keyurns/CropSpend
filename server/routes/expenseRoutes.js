const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Expense = require('../models/Expense');

const exchangeRates = { INR: 1, USD: 83.5, EUR: 90.2, GBP: 105.1 };

const detectAnomaly = (amountINR, category, date) => {
    const dayOfWeek = new Date(date).getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (category === 'Food' && amountINR > 15000) return { isFlagged: true, reason: 'Anomalous amount for Food/Meals category.' };
    if (isWeekend && category !== 'Travel' && category !== 'Food') return { isFlagged: true, reason: 'Suspicious weekend purchase.' };
    if ((category === 'Software' || category === 'Equipment') && amountINR > 500000) return { isFlagged: true, reason: 'High-value asset purchase.' };

    return { isFlagged: false, reason: null };
};

router.post('/', auth, async (req, res) => {
    try {
        const { title, originalAmount, currency, category, date } = req.body;
        const rate = exchangeRates[currency] || 1;
        const baseAmountINR = originalAmount * rate;
        const anomalyAnalysis = detectAnomaly(baseAmountINR, category, date);

        const newExpense = new Expense({
            title, originalAmount, currency, amount: baseAmountINR, category, date,
            isFlagged: anomalyAnalysis.isFlagged,
            flagReason: anomalyAnalysis.reason,
            requestedBy: req.user.id
        });

        const expense = await newExpense.save();
        res.json(expense);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/', auth, async (req, res) => {
    try {
        let expenses;
        if (req.user.role === 'manager' || req.user.role === 'admin') {
            expenses = await Expense.find().populate('requestedBy', ['username', 'department']).sort({ date: -1 });
        } else {
            expenses = await Expense.find({ requestedBy: req.user.id }).populate('requestedBy', ['username', 'department']).sort({ date: -1 });
        }
        res.json(expenses);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.put('/approve/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });

    try {
        const { status, rejectionReason } = req.body;
        let expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        expense.status = status;
        if (status === 'Rejected' && rejectionReason) expense.rejectionReason = rejectionReason;

        await expense.save();
        res.json(expense);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;