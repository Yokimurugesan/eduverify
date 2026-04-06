const fs = require('fs');
const path = require('path');

// Helper to clean credentials
const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const EMAIL_USER = (process.env.EMAIL_USER || "").trim(); // Still used as a fallback sender or descriptive name

/**
 * Diagnostic utility to verify Resend API connectivity
 */
async function verifyConnection() {
    console.log("[Email Debug] Verifying Resend API connection...");
    if (!RESEND_API_KEY) {
        console.error("❌ Email Error: RESEND_API_KEY is missing in .env");
        return false;
    }
    
    try {
        // Simple HEAD request or similar to check if the API is reachable
        const response = await fetch('https://api.resend.com/emails', {
            method: 'OPTIONS',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
        });
        
        if (response.status === 204 || response.status === 200 || response.status === 405) {
            console.log("✅ Success: Resend API is reachable via HTTPS.");
            return true;
        } else {
            console.warn(`[Email Debug] Resend API responded with status: ${response.status}`);
            return true; // Likely still okay, just not authenticated for OPTIONS
        }
    } catch (err) {
        console.error("❌ Email API unreachable:", err.message);
        return false;
    }
}

/**
 * Send an email using the Resend API (HTTPS)
 * This bypasses Render's SMTP block entirely.
 */
async function sendEmail(to, subject, text, attachments = []) {
    if (!RESEND_API_KEY) {
        console.warn("Mailer Warning: RESEND_API_KEY not configured in .env");
        return;
    }

    try {
        // Prepare attachments for Resend API (convert paths to base64 content)
        const processedAttachments = attachments.map(att => {
            if (att.path && fs.existsSync(att.path)) {
                const content = fs.readFileSync(att.path).toString('base64');
                return {
                    filename: att.filename,
                    content: content
                };
            }
            return att;
        }).filter(att => att.content || att.path);

        const payload = {
            from: 'EduVerify <onboarding@resend.dev>', // Note: Until domain is verified, use Resend's onboarding email
            to: Array.isArray(to) ? to : [to],
            subject: subject,
            text: text,
            attachments: processedAttachments
        };

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            console.log(`Email successfully sent to ${to} via Resend. ID: ${result.id}`);
        } else {
            console.error(`Resend API Error [To: ${to}]:`, result.message || JSON.stringify(result));
            if (result.message && result.message.includes('onboarding')) {
                console.error("-> Hint: On the free Resend tier, you can only send emails to YOURSELF until you verify a domain.");
            }
        }
    } catch (err) {
        console.error(`Email Failure (API) [To: ${to}]:`, err.message);
    }
}

// Initial verification
verifyConnection();

module.exports = { sendEmail, verifyConnection };