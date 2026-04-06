const nodemailer = require('nodemailer');
const dns = require('dns');

// Helper to clean credentials
const EMAIL_USER = (process.env.EMAIL_USER || "").trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || "").replace(/\s+/g, '');

// Create transporter using Gmail with robust settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for 587 (uses STARTTLS)
    // Force IPv4 lookup directly in DNS resolution (fixes ENETUNREACH IPv6 error on Render)
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
    },
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    },
    // Increased timeouts to prevent hanging or premature timeouts on slow networks
    connectionTimeout: 60000, 
    greetingTimeout: 60000,
    socketTimeout: 60000
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