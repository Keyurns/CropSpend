const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Cloudinary Upload Middleware
const Expense = require('../models/Expense');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog'); // Ensure you have this model created!
const nodemailer = require('nodemailer');
const axios = require('axios');

// --- 1. Email Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: `"CROPSPEND System" <${process.env.EMAIL_USER}>`,
            to, subject, text
        });
        console.log(`Notification email sent to ${to}`);
    } catch (error) {
        console.error("Failed to send notification email:", error);
    }
};

// --- 2. Live Currency Helper ---
const getLiveExchangeRate = async (currency) => {
    if (currency === 'INR') return 1;
    try {
        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/${currency}`);
        return response.data.conversion_rates.INR;
    } catch (error) {
        console.error("Exchange API failed, falling back to static rates");
        const fallbacks = { USD: 83.5, EUR: 90.2, GBP: 105.1 };
        return fallbacks[currency] || 1;
    }
};

// --- 3. AI Anomaly Helper ---
const detectAnomaly = (amountINR, category, date) => {
    const dayOfWeek = new Date(date).getDay(); 
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (category === 'Food' && amountINR > 15000) return { isFlagged: true, reason: 'Anomalous amount for Food/Meals category.' };
    if (isWeekend && category !== 'Travel' && category !== 'Food') return { isFlagged: true, reason: 'Suspicious weekend purchase.' };
    if ((category === 'Software' || category === 'Equipment') && amountINR > 500000) return { isFlagged: true, reason: 'High-value asset purchase.' };

    return { isFlagged: false, reason: null };
};


// ==========================================
// API ROUTES
// ==========================================

// @route   POST /api/expenses
// @desc    Create expense, Upload Receipt, Convert Currency & Notify Managers
router.post('/', [auth, upload.single('receipt')], async (req, res) => {
    try {
        const { title, originalAmount, currency, category, date } = req.body;
        
        // 1. Get receipt URL from Cloudinary (if file was attached)
        const receiptUrl = req.file ? req.file.path : null; 

        // 2. Fetch Live Currency Rate
        const rate = await getLiveExchangeRate(currency);
        const baseAmountINR = originalAmount * rate;
        
        // 3. Check for Anomalies
        const anomalyAnalysis = detectAnomaly(baseAmountINR, category, date);

        // 4. Save to Database
        const newExpense = new Expense({
            title, originalAmount, currency, amount: baseAmountINR, category, date,
            receiptUrl, 
            isFlagged: anomalyAnalysis.isFlagged,
            flagReason: anomalyAnalysis.reason,
            requestedBy: req.user.id
        });

        const expense = await newExpense.save();

        // 5. Notify Managers
        try {
            const requestingUser = await User.findById(req.user.id);
            const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
            
            if (managers.length > 0) {
                const managerEmails = managers.map(m => m.email).join(',');
                const subject = `New Expense Request: ${title}`;
                const message = `Employee ${requestingUser.username} has submitted a new expense request.\n\nDetails:\n- Merchant: ${title}\n- Amount: ${originalAmount} ${currency}\n- Category: ${category}\n\nPlease log in to the CROPSPEND dashboard to review this request.`;
                sendEmail(managerEmails, subject, message);
            }
        } catch (emailErr) {
            console.error("Error processing manager notification:", emailErr);
        }

        res.json(expense);
    } catch (err) {
        console.error("Expense creation error:", err);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/expenses
// @desc    Get expenses (Role-based filtering)
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


// @route   PUT /api/expenses/approve/:id
// @desc    Approve/Reject expense, Create Audit Log & Notify Employee
router.put('/approve/:id', auth, async (req, res) => {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    try {
        const { status, rejectionReason } = req.body;
        
        let expense = await Expense.findById(req.params.id).populate('requestedBy', ['username', 'email']);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        const previousStatus = expense.status;
        expense.status = status;
        if (status === 'Rejected' && rejectionReason) expense.rejectionReason = rejectionReason;

        await expense.save();

        // --- 1. Create the Audit Log ---
        try {
            const logEntry = new AuditLog({
                action: `EXPENSE_${status.toUpperCase()}`,
                performedBy: req.user.id,
                targetEntityId: expense._id,
                details: { 
                    oldStatus: previousStatus, 
                    newStatus: status,
                    reason: rejectionReason || 'N/A'
                }
            });
            await logEntry.save();
        } catch (logErr) {
            console.error("Failed to write audit log:", logErr);
        }

        // --- 2. Notify Employee ---
        try {
            if (expense.requestedBy && expense.requestedBy.email) {
                const subject = `Expense Status Update: ${status.toUpperCase()}`;
                let message = `Hello ${expense.requestedBy.username},\n\nYour expense request for "${expense.title}" (${expense.originalAmount} ${expense.currency}) has been marked as: ${status}.\n`;
                
                if (status === 'Rejected' && rejectionReason) {
                    message += `\nReason from manager: ${rejectionReason}`;
                }
                message += `\nLog in to your CROPSPEND dashboard for more details.`;
                
                sendEmail(expense.requestedBy.email, subject, message);
            }
        } catch (emailErr) {
            console.error("Error processing employee notification:", emailErr);
        }

        res.json(expense);
    } catch (err) {
        console.error("Expense update error:", err);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/expenses/email-report
// @desc    Generate CSV and email it to ANY specified address
router.post('/email-report', auth, async (req, res) => {
    try {
        const { csvData, filterName, recipientEmail } = req.body;
        
        if (!recipientEmail) return res.status(400).json({ msg: 'Recipient email is required' });

        const user = await User.findById(req.user.id);
        const senderName = user ? user.username : 'A CROPSPEND team member';

        const dateStr = new Date().toISOString().split('T')[0];
        const subject = `CROPSPEND Expense Report: ${filterName} (${dateStr})`;
        const text = `Hello,\n\n${senderName} has shared an expense report with you for the "${filterName}" filter.\n\nPlease find the CSV data attached to this email.\n\nBest regards,\nCROPSPEND System`;

        await transporter.sendMail({
            from: `"CROPSPEND Reports" <${process.env.EMAIL_USER}>`,
            to: recipientEmail, 
            subject,
            text,
            attachments: [{ filename: `CROPSPEND_Report_${filterName}_${dateStr}.csv`, content: csvData }]
        });

        res.json({ msg: 'Report emailed successfully' });
    } catch (err) {
        console.error("Error emailing report:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;