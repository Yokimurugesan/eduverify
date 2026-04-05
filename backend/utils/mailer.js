const nodemailer = require('nodemailer');

// Helper to clean credentials
const EMAIL_USER = (process.env.EMAIL_USER || "").trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || "").replace(/\s+/g, '');

// Create transporter using Gmail with robust settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    // Add timeouts to prevent hanging
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000
});

// Function to send email
async function sendEmail(to, subject, text, attachments = []) {
    if (!EMAIL_USER || !EMAIL_PASS) {
        console.warn("Mailer Warning: EMAIL_USER or EMAIL_PASS not configured in .env");
        return;
    }

    const mailOptions = {
        from: EMAIL_USER,
        to,
        subject,
        text,
        attachments // Array of { filename: '...', path: '...' }
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
    } catch (err) {
        console.error(`Email Failure [To: ${to}]:`, err.message);
        if (err.message.includes('535')) {
            console.error("-> Hint: 'Invalid login' (535) usually means wrong App Password or 2FA not enabled.");
        }
    }
}

module.exports = sendEmail;