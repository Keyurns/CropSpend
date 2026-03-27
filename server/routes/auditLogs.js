const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/auditlogs
// @desc    Get all system audit logs (ADMIN ONLY)
router.get('/', auth, async (req, res) => {
    // SECURITY CHECK: Kick out anyone who isn't an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access denied. Admins only.' });
    }

    try {
        // Fetch logs, populate the user info, and sort by newest first
        const logs = await AuditLog.find()
            .populate('performedBy', ['username', 'email', 'role'])
            .sort({ createdAt: -1 });
            
        res.json(logs);
    } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;