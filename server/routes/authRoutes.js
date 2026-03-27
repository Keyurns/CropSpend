const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const upload = require('../middleware/upload');
const nodemailer = require('nodemailer');

// Email Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, subject, text) => {
    try { await transporter.sendMail({ from: `"CROPSPEND Auth" <${process.env.EMAIL_USER}>`, to, subject, text }); } 
    catch (error) { console.error("Email failed:", error); }
};

// @route   POST /api/auth/register
// @desc    Register a new user as PENDING & upload ID Proof
router.post('/register', upload.single('idProof'), async (req, res) => {
    try {
        const { username, email, password, department } = req.body;
        
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // 2. Get ID Proof URL from Cloudinary
        const idProofUrl = req.file ? req.file.path : null;
        if (!idProofUrl) return res.status(400).json({ msg: 'Identification proof is required for registration.' });

        // 3. Hash password and create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username, email, password: hashedPassword, department,
            idProofUrl,
            status: 'Pending' // Locked by default
        });

        await user.save();

        // 4. Email all Admins that a new request is pending
        try {
            const admins = await User.find({ role: 'admin' });
            if (admins.length > 0) {
                const adminEmails = admins.map(a => a.email).join(',');
                sendEmail(adminEmails, `New Account Request: ${username}`, `A new employee (${username} - ${email}) has requested CROPSPEND access.\n\nPlease log in to the Admin Dashboard to review their ID proof and approve or reject their account.`);
            }
        } catch (err) { console.error("Admin notification failed", err); }

        res.json({ msg: 'Registration submitted successfully. Please wait for Admin approval.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        // --- NEW SECURITY CHECK ---
        if (user.status === 'Pending') {
            return res.status(403).json({ msg: 'Your account is still pending Admin approval.' });
        }
        if (user.status === 'Rejected') {
            return res.status(403).json({ msg: 'Your account registration was rejected.' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secretcode', { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role, username: user.username });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;