const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    // The exact action taken (e.g., 'EXPENSE_APPROVED', 'EXPENSE_REJECTED')
    action: { 
        type: String, 
        required: true 
    },
    
    // The user (Manager/Admin) who clicked the button
    performedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    // The ID of the specific expense that was modified
    targetEntityId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    
    // A flexible object to store the exact changes made (old status, new status, rejection reasons)
    details: { 
        type: Object 
    },
    
    // The exact moment the action occurred
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);