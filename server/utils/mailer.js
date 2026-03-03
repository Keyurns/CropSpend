const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'cropspend@gmail.com', // Your Gmail address
        pass: 'mzxq gspj ouvy myrz'  // The 16-character App Password
    }
});

// Helper function to send emails
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: '"CorpSpend System" <cropspend@gmail.com>',
            to,
            subject,
            text
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error("Email Error:", error);
    }
};

module.exports = sendEmail;