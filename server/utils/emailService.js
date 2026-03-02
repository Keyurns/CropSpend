const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;
let testAccountPromise = null;

// Check if real email credentials are configured
const hasRealCredentials = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    return user && pass && 
           !user.includes('your_email') && 
           !user.includes('your_') &&
           !pass.includes('your_') &&
           !pass.includes('paste_');
};

// Get or create transporter
const getTransporter = async () => {
    if (transporter) return { transporter, isTest: !hasRealCredentials() };

    if (hasRealCredentials()) {
        // Use real Gmail credentials
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        return { transporter, isTest: false };
    } else {
        // Development mode: avoid external SMTP to prevent SSL/TLS issues
        // Use Nodemailer's jsonTransport so emails are generated instantly in-memory.
        transporter = nodemailer.createTransport({
            jsonTransport: true
        });
        console.log('Email dev mode: using jsonTransport (no real SMTP connection).');
        return { transporter, isTest: true };
    }
};

const sendNotification = async (to, subject, htmlContent) => {
    const { transporter: t, isTest } = await getTransporter();
    
    const info = await t.sendMail({
        from: `"CorpSpend" <${isTest ? 'noreply@corpspend.demo' : process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
    });

    if (isTest) {
        // Return preview URL for Ethereal
        // With jsonTransport there is no real preview URL, but we return the
        // generated message object so the API can still respond successfully.
        console.log('Email dev mode payload:', info.message);
        return { success: true, previewUrl: null };
    }
    
    return { success: true };
};

module.exports = { sendNotification };
