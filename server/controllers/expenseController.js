const Expense = require('../models/Expense');
const User = require('../models/User');
const { sendNotification } = require('../utils/emailService');

// Helper to get manager email for notifications
const getManagerEmail = async () => {
    // Finds the first user with manager role; defaults to admin if none found
    const manager = await User.findOne({ role: 'manager' });
    return manager ? manager.email : 'admin@nikamaqua.com'; 
};

const getExpensesForUser = async (req) => {
    if (req.user.role === 'manager' || req.user.role === 'admin') {
        return Expense.find().populate('requestedBy', 'username email department');
    }
    return Expense.find({ requestedBy: req.user.id }).populate('requestedBy', 'username email department');
};

exports.getExpenses = async (req, res) => {
    try {
        const expenses = await getExpensesForUser(req);

        // Lightweight AI duplicate highlighting at read-time so older data also shows flags
        const duplicateMap = new Map();

        expenses.forEach((exp) => {
            const userId = exp.requestedBy?._id?.toString() || exp.requestedBy?.toString() || 'unknown';
            const key = [
                userId,
                exp.amount,
                (exp.category || '').toLowerCase(),
                (exp.title || '').trim().toLowerCase()
            ].join('|');

            if (!duplicateMap.has(key)) {
                duplicateMap.set(key, []);
            }
            duplicateMap.get(key).push(exp);
        });

        duplicateMap.forEach((group) => {
            if (group.length > 1) {
                group.forEach((exp) => {
                    exp.isFlagged = true;
                    const reason = 'Potential Duplicate: Similar request found for same user, title, category, and amount.';
                    exp.flagReason = exp.flagReason
                        ? `${exp.flagReason} | ${reason}`
                        : reason;
                });
            }
        });

        res.json(expenses);
    } catch (err) {
        console.error("Fetch Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { title, originalAmount, amount, currency, category, date } = req.body;
        const userId = req.user.id;
        
        const inputAmount = originalAmount || amount;
        let finalAmountInINR = inputAmount;
        let finalCurrency = currency || 'INR';

        // A. Currency Conversion Logic
        if (finalCurrency !== 'INR') {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
                const data = await response.json();
                const rate = data.rates[finalCurrency];
                if (rate) finalAmountInINR = inputAmount / rate;
            } catch (apiError) {
                console.error("Exchange API failed:", apiError);
                return res.status(503).json({ msg: "Currency conversion service unavailable." });
            }
        }

        const roundedAmount = Math.round(finalAmountInINR);
        let isFlagged = false;
        let flagReasons = [];

        // B. AI Logic (Duplicate & Anomaly Detection)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const possibleDuplicate = await Expense.findOne({
            requestedBy: userId,
            amount: roundedAmount,
            date: { $gte: sevenDaysAgo }
        });

        if (possibleDuplicate) {
            isFlagged = true;
            flagReasons.push("Potential Duplicate: Same amount submitted recently.");
        }

        const pastExpenses = await Expense.find({ requestedBy: userId, category, status: 'Approved' });
        if (pastExpenses.length >= 3) {
            const averageSpend = pastExpenses.reduce((sum, exp) => sum + exp.amount, 0) / pastExpenses.length;
            if (roundedAmount > averageSpend * 2.5) {
                isFlagged = true;
                flagReasons.push(`Spending Anomaly: Higher than average (₹${Math.round(averageSpend)})`);
            }
        }

        const newExpense = new Expense({
            title,
            originalAmount: inputAmount,
            currency: finalCurrency,
            amount: roundedAmount,
            category,
            date,
            requestedBy: userId,
            isFlagged,
            flagReason: flagReasons.join(" | ")
        });

        const savedExpense = await newExpense.save();

        // D. Manager Notification
        const managerEmail = await getManagerEmail();
        
        // Fetch the actual user from the database to get their name/email
        const requestingUser = await User.findById(req.user.id);
        const employeeName = requestingUser ? (requestingUser.username || requestingUser.email) : 'Employee';

        const managerHtml = `
            <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4f46e5;">New Expense Request: ${title}</h2>
                <p><strong>Employee:</strong> ${employeeName}</p>
                <p><strong>Amount:</strong> ${inputAmount} ${finalCurrency} (Converted: ₹${roundedAmount})</p>
                <p><strong>Status:</strong> ${isFlagged ? '<span style="color:red;">⚠️ Flagged for Review</span>' : '<span style="color:green;">✅ Verified</span>'}</p>
                <p>Please log in to the dashboard to approve or reject this request.</p>
            </div>
        `;
        await sendNotification(managerEmail, `Action Required: New Expense - ${title}`, managerHtml);

        res.status(201).json(savedExpense);
    } catch (err) {
        console.error("Create Expense Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, reason } = req.body; 
        
        let expense = await Expense.findById(req.params.id).populate('requestedBy', 'email username');
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        expense.status = status;
        expense.actionTakenBy = req.user.id;
        
        if (status === 'Rejected') {
            expense.rejectionReason = reason;
        }

        await expense.save();

        // 1. Setup Dynamic UI Variables for the Email
        const isApproved = status === 'Approved';
        const statusColor = isApproved ? '#10b981' : '#ef4444'; // Green for approved, Red for rejected
        const actionText = isApproved ? 'approved' : 'rejected';
        
        // 2. Conditionally show the reason ONLY if rejected
        const reasonHtml = !isApproved 
            ? `<p style="padding: 10px; background: #fef2f2; border-left: 4px solid #ef4444; color: #b91c1c;"><strong>Reason:</strong> ${reason || 'No specific reason provided'}</p>` 
            : ''; 

        // 3. Generate dynamic HTML
        const employeeHtml = `
            <div style="font-family: sans-serif; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
                <h2 style="color: ${statusColor};">Expense Update: ${status}</h2>
                <p>Hello ${expense.requestedBy.username || 'there'},</p>
                <p>Your request for "<strong>${expense.title}</strong>" has been <strong>${actionText}</strong>.</p>
                ${reasonHtml}
                <p style="margin-top: 20px; font-size: 14px; color: #64748b;">Thank you for using CorpSpend.</p>
            </div>
        `;

        await sendNotification(expense.requestedBy.email, `Expense Update: ${status}`, employeeHtml);
        res.json(expense);
    } catch (err) {
        console.error("Update Status Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.sendExpenseReport = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'Valid email is required' });

        const expenses = await getExpensesForUser(req);
        const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

        let rows = '';
        expenses.forEach(e => {
            rows += `
                <tr>
                    <td style="padding:8px;border:1px solid #ddd">${escapeHtml(e.title)}</td>
                    <td style="padding:8px;border:1px solid #ddd">₹${Number(e.amount).toLocaleString()}</td>
                    <td style="padding:8px;border:1px solid #ddd">${e.status}</td>
                    <td style="padding:8px;border:1px solid #ddd">${new Date(e.date).toLocaleDateString()}</td>
                </tr>`;
        });

        const reportHtml = `
            <h1>CorpSpend Report - ${dateStr}</h1>
            <p><strong>Total Reimbursement:</strong> ₹${total.toLocaleString()}</p>
            <table style="width:100%; border-collapse: collapse;">
                <thead><tr style="background:#f1f5f9"><th>Title</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;

        const result = await sendNotification(email, `Your Expense Report - ${dateStr}`, reportHtml);
        res.json({ msg: 'Report sent!', previewUrl: result?.previewUrl });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to send report' });
    }
};

exports.exportExpensesCsv = async (req, res) => {
    try {
        const expenses = await getExpensesForUser(req);
        const headers = ['Description', 'Category', 'Amount (INR)', 'Status', 'Date'];
        
        const rows = expenses.map(e => [
            escapeCsv(e.title),
            escapeCsv(e.category),
            e.amount,
            e.status,
            new Date(e.date).toLocaleDateString()
        ].join(','));

        const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ msg: 'CSV Export failed' });
    }
};

// Utility Helpers
function escapeHtml(str) { return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function escapeCsv(v) { let s = v == null ? '' : String(v); return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s; }