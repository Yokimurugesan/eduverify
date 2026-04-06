const { google } = require('googleapis');
const nodemailer = require('nodemailer');

/**
 * FINAL FIX: Gmail REST API (HTTPS)
 * This uses existing Google OAuth2 credentials to bypass Render's SMTP block.
 */

const EMAIL_USER = (process.env.EMAIL_USER || "").trim();
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_SECRET = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
const GOOGLE_REFRESH_TOKEN = (process.env.GOOGLE_REFRESH_TOKEN || "").trim();
const GOOGLE_REDIRECT_URI = (process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground").trim();

// Setup OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Diagnostic utility to verify Gmail API connectivity
 */
async function verifyConnection() {
    console.log("[Email Debug] Verifying Gmail REST API connection...");
    try {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_REFRESH_TOKEN) {
            console.error("❌ Email Error: Google OAuth2 credentials missing in .env");
            return false;
        }

        // Test by fetching a fresh token or basic profile info
        const { token } = await oauth2Client.getAccessToken();
        if (token) {
            console.log("✅ Success: Gmail API is authenticated and ready via HTTPS.");
            return true;
        }
        return false;
    } catch (err) {
        console.error("❌ Gmail API Auth Error:", err.message);
        console.error("-> Hint: Your GOOGLE_REFRESH_TOKEN may be expired or invalid.");
        return false;
    }
}

/**
 * Send an email via the Gmail REST API (HTTPS/Port 443)
 * This uses nodemailer ONLY as a MIME generator.
 */
async function sendEmail(to, subject, text, attachments = []) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REFRESH_TOKEN) {
        console.warn("Mailer Warning: Google OAuth2 not configured in .env");
        return;
    }

    try {
        // 1. Generate the raw MIME message using nodemailer (robust and handles attachments)
        const transporter = nodemailer.createTransport({
            // We don't use this for sending, just for the internal 'envelope' and 'message' logic
            jsonTransport: true 
        });

        const mailOptions = {
            from: EMAIL_USER,
            to,
            subject,
            text,
            attachments
        };

        // We use a dummy nodemailer smtp pool just for building the raw MIME
        const dummyTransporter = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });

        const { message } = await dummyTransporter.sendMail(mailOptions);
        
        // 2. Base64 Safe Encode the MIME message for the Gmail API
        const raw = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 3. Send via the Gmail REST API (HTTPS - No SMTP ports involved!)
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });

        console.log(`Email successfully sent to ${to} via Gmail API. ID: ${res.data.id}`);
    } catch (err) {
        console.error(`Email Failure (Gmail API) [To: ${to}]:`, err.message);
    }
}

// Initial verification on load
verifyConnection();

module.exports = { sendEmail, verifyConnection };