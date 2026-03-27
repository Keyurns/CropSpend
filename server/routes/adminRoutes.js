const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// --- Email Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, subject, text) => {
    try { await transporter.sendMail({ from: `"CROPSPEND Admin" <${process.env.EMAIL_USER}>`, to, subject, text }); } 
    catch (error) { console.error("Email failed:", error); }
};

// ==========================================
// STRICT ADMIN-ONLY SECURITY MIDDLEWARE
// ==========================================
const adminCheck = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'CRITICAL SECURITY: Access Denied. Admins Only.' });
    }
    next();
};

// @route   GET /api/admin/users
// @desc    Get ALL users (Pending, Active, Rejected) so Admin can review them
router.get('/users', [auth, adminCheck], async (req, res) => {
    try {
        // We exclude the password hash from the results for security
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Approve or Reject a pending account & Email the user
router.put('/users/:id/status', [auth, adminCheck], async (req, res) => {
    try {
        const { status } = req.body; // Expects 'Active' or 'Rejected'
        
        let targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        targetUser.status = status;
        await targetUser.save();

        // --- EMAIL THE EMPLOYEE ---
        if (status === 'Active') {
            sendEmail(targetUser.email, "Account Approved!", `Hello ${targetUser.username},\n\nYour identity has been verified and your CROPSPEND account is now Active. You can now log in and submit expenses.`);
        } else if (status === 'Rejected') {
            sendEmail(targetUser.email, "Account Request Declined", `Hello ${targetUser.username},\n\nUnfortunately, your request for a CROPSPEND account has been rejected by an Administrator. If you believe this is a mistake, please contact HR.`);
        }

        res.json(targetUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Change a user's role (Promote to Manager/Admin, or demote to Employee)
router.put('/users/:id/role', [auth, adminCheck], async (req, res) => {
    try {
        const { role } = req.body; // Expects 'employee', 'manager', or 'admin'
        
        // Prevent an admin from accidentally demoting themselves and locking themselves out
        if (req.params.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ msg: 'You cannot demote your own admin account.' });
        }

        let targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });

        targetUser.role = role;
        await targetUser.save();

        // Optional: Email them about the promotion
        sendEmail(targetUser.email, "Role Updated", `Hello ${targetUser.username},\n\nYour CROPSPEND account role has been updated to: ${role.toUpperCase()}.`);

        res.json(targetUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Permanently remove a user from the system
router.delete('/users/:id', [auth, adminCheck], async (req, res) => {
    try {
        // Prevent an admin from deleting themselves
        if (req.params.id === req.user.id) {
            return res.status(400).json({ msg: 'You cannot delete your own admin account.' });
        }

        await User.findByIdAndDelete(req.params.id);
        
        res.json({ msg: 'User has been permanently deleted from the system.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;