const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    receiptUrl: { type: String, required: false },
    title: { type: String, required: true },
    originalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    amount: { type: Number, required: true }, 
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    rejectionReason: { type: String },
    isFlagged: { type: Boolean, default: false }, 
    flagReason: { type: String }, 
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
    
});

module.exports = mongoose.model('Expense', ExpenseSchema);