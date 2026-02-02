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
        // Use Ethereal test account (no setup needed, works instantly)
        if (!testAccountPromise) {
            testAccountPromise = nodemailer.createTestAccount();
        }
        const testAccount = await testAccountPromise;
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('Using Ethereal test email account:', testAccount.user);
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
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('Email preview URL:', previewUrl);
        return { success: true, previewUrl };
    }
    
    return { success: true };
};

module.exports = { sendNotification };
