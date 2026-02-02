const Expense = require('../models/Expense');
const User = require('../models/User');
const { sendNotification } = require('../utils/emailService');

const getExpensesForUser = async (req) => {
    if (req.user.role === 'manager' || req.user.role === 'admin') {
        return Expense.find().populate('requestedBy', 'username email department');
    }
    return Expense.find({ requestedBy: req.user.id }).populate('requestedBy', 'username email department');
};

exports.getExpenses = async (req, res) => {
    try {
        if (req.user.role === 'manager' || req.user.role === 'admin') {
            const expenses = await Expense.find().populate('requestedBy', 'username department');
            return res.json(expenses);
        }
        const expenses = await Expense.find({ requestedBy: req.user.id });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.createExpense = async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;
        const newExpense = new Expense({
            title, amount, category, date,
            requestedBy: req.user.id
        });
        const expense = await newExpense.save();
        
        // Notify Manager (Hardcoded for demo, normally dynamic)
        // await sendNotification('manager@company.com', 'New Expense', `User has requested ${amount}`);
        
        res.json(expense);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        let expense = await Expense.findById(req.params.id);
        if (!expense) return res.status(404).json({ msg: 'Expense not found' });

        expense.status = status;
        expense.actionTakenBy = req.user.id;
        if (status === 'Rejected') expense.rejectionReason = rejectionReason;

        await expense.save();
        res.json(expense);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.sendExpenseReport = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ msg: 'Valid email address is required' });
        }
        const expenses = await getExpensesForUser(req);
        const isManagerOrAdmin = req.user.role === 'manager' || req.user.role === 'admin';
        const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
        const date = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

        const rows = expenses.map(e => {
            const requestedBy = e.requestedBy ? (e.requestedBy.username || e.requestedBy.email || '—') : '—';
            const dept = e.requestedBy?.department ? ` (${e.requestedBy.department})` : '';
            return `
        <tr>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${escapeHtml(e.title || '—')}</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${escapeHtml(e.category || '—')}</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">₹${Number(e.amount || 0).toLocaleString()}</td>
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${escapeHtml(e.status || '—')}</td>
            ${isManagerOrAdmin ? `<td style="padding:8px 12px;border:1px solid #e2e8f0">${escapeHtml(requestedBy + dept)}</td>` : ''}
            <td style="padding:8px 12px;border:1px solid #e2e8f0">${e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
        </tr>`;
        }).join('');

        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;color:#334155;line-height:1.5;max-width:720px;margin:0 auto;padding:24px}</style></head>
<body>
    <h1 style="color:#1e293b;margin-bottom:4px">CorpSpend Expense Report</h1>
    <p style="color:#64748b;margin-bottom:24px">Generated on ${date}</p>
    <p style="margin-bottom:16px"><strong>Total amount:</strong> ₹${total.toLocaleString()}</p>
    <p style="margin-bottom:16px"><strong>Total entries:</strong> ${expenses.length}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
        <thead>
            <tr style="background:#f1f5f9">
                <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Description</th>
                <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Category</th>
                <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Amount</th>
                <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Status</th>
                ${isManagerOrAdmin ? '<th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Requested by</th>' : ''}
                <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left">Date</th>
            </tr>
        </thead>
        <tbody>${rows}
        </tbody>
    </table>
    <p style="margin-top:24px;color:#64748b;font-size:14px">This is an automated report from CorpSpend.</p>
</body>
</html>`;

        const result = await sendNotification(email, `CorpSpend Expense Report – ${date}`, html);
        if (result.previewUrl) {
            // Test mode - return preview link
            res.json({ 
                msg: 'Demo mode: Email generated successfully!', 
                previewUrl: result.previewUrl,
                note: 'Click the link below to view the email (Ethereal test service)'
            });
        } else {
            res.json({ msg: 'Report sent to ' + email });
        }
    } catch (err) {
        console.error('Send report error:', err.message);
        res.status(500).json({ msg: err.message || 'Failed to send email. Check server email configuration.' });
    }
};

function escapeHtml(str) {
    if (str == null) return '—';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

exports.exportExpensesCsv = async (req, res) => {
    try {
        const expenses = await getExpensesForUser(req);
        const isManagerOrAdmin = req.user.role === 'manager' || req.user.role === 'admin';
        const headers = ['Description', 'Category', 'Amount (₹)', 'Status', ...(isManagerOrAdmin ? ['Requested by', 'Department'] : []), 'Date'];
        const escapeCsv = (v) => {
            const s = v == null ? '' : String(v);
            return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s;
        };
        const rows = expenses.map(e => {
            const base = [e.title || '', e.category || '', e.amount ?? '', e.status || ''];
            if (isManagerOrAdmin) {
                base.push(e.requestedBy?.username || '', e.requestedBy?.department || '');
            }
            base.push(e.date ? new Date(e.date).toLocaleDateString() : '');
            return base.map(escapeCsv).join(',');
        });
        const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
        const filename = `expense-report-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error('Export CSV error:', err.message);
        res.status(500).json({ msg: 'Failed to export' });
    }
};