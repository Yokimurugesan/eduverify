const nodemailer = require('nodemailer');

// Create transporter using Gmail (or any email provider)
const transporter = nodemailer.createTransport({
    service: 'gmail',  // you can change to outlook, yahoo, etc.
    auth: {
        user: process.env.EMAIL_USER,   // your email
        pass: process.env.EMAIL_PASS    // app password for Gmail
    }
});

// Function to send email
async function sendEmail(to, subject, text) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error("Error sending email:", err.message);
    }
}

module.exports = sendEmail;