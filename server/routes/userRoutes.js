const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Reuse our Cloudinary logic
const User = require('../models/User');

// @route   PUT /api/users/profile
// @desc    Update current user's profile info & picture
router.put('/profile', [auth, upload.single('profilePic')], async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findById(req.user.id);

        if (username) user.username = username;
        if (req.file) user.profilePicUrl = req.file.path; // Cloudinary URL

        await user.save();

        res.json({ 
            msg: 'Profile updated successfully', 
            username: user.username, 
            profilePicUrl: user.profilePicUrl 
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;