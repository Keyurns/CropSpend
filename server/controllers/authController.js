const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password, department } = req.body;
    console.log('Register attempt:', email || '(no email)');
    if (!email || !password || !username) {
        return res.status(400).json({ msg: 'Username, email and password are required' });
    }
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in .env');
        return res.status(500).json({ msg: 'Server misconfiguration' });
    }
    try {
        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const role = (req.body.role && ['employee', 'manager', 'admin'].includes(req.body.role))
            ? req.body.role : 'employee';
        user = new User({
            username: (username || '').trim(),
            email: email.trim().toLowerCase(),
            password,
            department: department || 'General',
            role
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) {
                console.error('JWT sign error:', err.message);
                return res.status(500).json({ msg: 'Server error' });
            }
            res.json({ token, role: user.role });
        });
    } catch (err) {
        console.error('Register error:', err.message);
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        if (err.name === 'ValidationError') {
            const first = Object.values(err.errors)[0];
            return res.status(400).json({ msg: first ? first.message : 'Validation failed' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required' });
    }
    try {
        let user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id, role: user.role, name: user.username } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ role: 1, username: 1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};