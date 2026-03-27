const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String },
    role: { 
        type: String, 
        enum: ['employee', 'manager', 'admin'], 
        default: 'employee' 
    },
    // --- NEW IDENTITY FIELDS ---
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Rejected'],
        default: 'Pending' // All new accounts are locked by default
    },
    idProofUrl: {
        type: String, // Cloudinary URL for the uploaded ID
        required: false 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);