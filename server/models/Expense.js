const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    title: { type: String, required: true },

    originalAmount: { type: Number, required: true }, 
    currency: { type: String, default: 'INR' },       
    amount: { type: Number, required: true },         
    
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' }
});

module.exports = mongoose.model('Expense', ExpenseSchema);