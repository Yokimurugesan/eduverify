const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Document = require('../models/Document');
const ExtractedData = require('../models/ExtractedData');
const { fetchFormResponses } = require('../utils/googleFormService');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/mailer');
const QRCode = require('qrcode');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { areSemestersEqual, normalizeSemester } = require('../utils/semesterUtils');

// Helper to get verification URL (reused from userRoutes)
const getVerificationBaseURL = () => {
    if (process.env.FRONTEND_URL) return `${process.env.FRONTEND_URL}/verify?id=`;
    if (process.env.PUBLIC_IP) return `http://${process.env.PUBLIC_IP}:3000/verify?id=`;
    const interfaces = os.networkInterfaces();
    let foundIPs = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) foundIPs.push(iface.address);
        }
    }
    const selectedIP = foundIPs.find(ip => ip.startsWith('192.168.')) || 'localhost';
    return `http://${selectedIP}:3000/verify?id=`;
};


// ================= VERIFICATION HELPER =================
/**
 * Shared logic for verifying a single student entry (from sync or webhook)
 */
async function verifySingleResponse(data, shouldSendEmail = true, dryRun = false) {
    const { formName, formEmail, formRollNo, formCgpa, formSemester, formDocId } = data;

    if (!formEmail && !formDocId) return { status: "ignored" };

    // 1. Find Document (Prefer DocID if available, then by email + semester)
    let doc;
    let user;

    if (formDocId) {
        doc = await Document.findById(formDocId).populate('extractedData');
        if (doc) user = await User.findById(doc.userId);
    }

    if (!doc && formEmail) {
        user = await User.findOne({ email: formEmail.toLowerCase().trim() });
        if (!user) {
            console.warn(`[Verification] No user found with email: ${formEmail}`);
            return { status: "user_not_found" };
        }
    }

    // 2. Find Document by Email + Semester if not already found via DocID
    if (!doc && user) {
        console.log(`[Verification] Searching document for "${formEmail}" with semester "${formSemester}"`);
        
        doc = await Document.findOne({
            userId: user._id,
            semester: formSemester ? formSemester.trim() : "",
            status: { $in: ["pending", "verified"] }
        }).populate('extractedData');

        if (!doc) {
            // Fallback 1: Try normalized semester match
            const allDocs = await Document.find({ 
                userId: user._id, 
                status: { $in: ["pending", "verified"] } 
            }).populate('extractedData');
            
            if (formSemester) {
                doc = allDocs.find(d => areSemestersEqual(d.semester, formSemester));
            }
            
            if (doc) {
                console.log(`[Verification] Normalized match found: ${doc.semester}`);
            } else {
                console.warn(`[Verification] No document match found for semester "${formSemester}" for user ${formEmail}.`);
            }
        }
    }

    if (doc && doc.extractedData && (doc.extractedData.formStatus === 'sent' || doc.extractedData.formStatus === 'mismatch')) {
        const extractedEntry = doc.extractedData;
        
        const ocrCgpa = extractedEntry.cgpa || 0;
        const studentCgpa = parseFloat(formCgpa) || 0;
        const cgpaMatch = studentCgpa === ocrCgpa;

        const ocrSemester = extractedEntry.extractedSemester || "";
        const semesterMatch = areSemestersEqual(ocrSemester, formSemester);

        if (cgpaMatch && semesterMatch) {
            // SUCCESS: Both CGPA and Semester match
            doc.status = "verified";
            doc.verifiedBy = "auto";
            
            const verificationBaseURL = getVerificationBaseURL();
            const finalURL = `${verificationBaseURL}${doc._id}`;
            const qrCode = await QRCode.toDataURL(finalURL);
            
            if (!dryRun) {
                doc.qrCode = qrCode;
                doc.verificationURL = finalURL;
                await doc.save();
            }

            if (!dryRun) {
                extractedEntry.formStatus = "confirmed";
                extractedEntry.formData = { 
                    studentName: formName, 
                    rollNo: formRollNo, 
                    cgpa: studentCgpa, 
                    email: formEmail, 
                    semester: formSemester,
                    submittedAt: new Date()
                };
                await extractedEntry.save();
            }

            if (shouldSendEmail && !dryRun) {
                // IMPORTANT: Only send the "Verified" email IF the document wasn't ALREADY verified.
                // This prevents duplicate/spam emails during sync.
                if (doc.status !== "verified") {
                    await Notification.create({
                        userId: doc.userId,
                        message: `Verified! Your CGPA (${studentCgpa}) and Semester matches our records.`
                    });

                    // Send Email
                    try {
                        await sendEmail(
                            user.email,
                            "Document Verified Successfully! ✅",
                            `Hello ${user.name},\n\nYour marksheet has been successfully verified.\n\nYour entered CGPA: ${studentCgpa}\nSemester: ${formSemester}\nResult: ✅ Match confirmed\n\nThank you,\nEduVerify Team`
                        );
                    } catch (err) { console.error("Email failed:", err.message); }
                }
            }

            return { status: "verified", docId: doc._id };

        } else {
            // FAILURE: Mismatch
            if (!dryRun) {
                extractedEntry.formStatus = "mismatch";
                extractedEntry.formData = { 
                    studentName: formName, 
                    rollNo: formRollNo, 
                    cgpa: studentCgpa, 
                    email: formEmail, 
                    semester: formSemester,
                    submittedAt: new Date()
                };
                await extractedEntry.save();
            }
            
            if (!dryRun && doc.status === 'pending') {
                doc.status = "rejected";
                let reason = "";
                if (!cgpaMatch) reason += `CGPA mismatch: Student entered ${studentCgpa}, but OCR extracted ${ocrCgpa}. `;
                if (!semesterMatch) reason += `Semester mismatch: Student entered ${formSemester}, but OCR extracted ${ocrSemester}. `;
                doc.rejectionReason = reason.trim();
                await doc.save();
            }

            if (shouldSendEmail && !dryRun) {
                // IMPORTANT: Only send the "Mismatch" email IF the document was 'pending'.
                // If it was already 'rejected', we've already notified the user once.
                if (doc.status === 'pending') {
                    await Notification.create({
                        userId: doc.userId,
                        message: `Verification failed: Data mismatch detected (${!cgpaMatch ? 'CGPA' : ''}${!cgpaMatch && !semesterMatch ? ' & ' : ''}${!semesterMatch ? 'Semester' : ''}).`
                    });

                    try {
                        await sendEmail(
                            user.email,
                            "Verification Failed - Data Mismatch ❌",
                            `Hello ${user.name},\n\nVerification failed due to a data mismatch.\n\n${!cgpaMatch ? `CGPA: Entered ${studentCgpa}, Records show ${ocrCgpa}\n` : ''}${!semesterMatch ? `Semester: Entered ${formSemester}, Records show ${ocrSemester}\n` : ''}\nPlease contact the administrator.`
                        );
                    } catch (err) { console.error("Email failed:", err.message); }
                }
            }

            return { status: "mismatch", docId: doc?._id };
        }
    }
    return { status: "already_processed_or_no_doc" };
}

// ================= WEBHOOK ENDPOINT (AUTOMATED) =================
/**
 * Public endpoint called by Google Apps Script on Form Submit
 */
router.post('/webhook', async (req, res) => {
    try {
        const { name, email, semester, cgpa, rollNo } = req.body;
        console.log(`[Webhook] Received response for: ${email}`);

        const result = await verifySingleResponse({
            formName: name,
            formEmail: email,
            formRollNo: rollNo,
            formCgpa: cgpa,
            formSemester: semester
        });

        res.json({ message: "Webhook processed", result });
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).json({ error: "Webhook failed" });
    }
});


// ================= SYNC FORM RESPONSES (MANUAL) =================
router.post('/sync-responses', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Admin access only");

        const responses = await fetchFormResponses();
        
        // Group entries by (Email + Semester) to prioritize "Verified" over "Mismatch"
        // Key: lowerCaseEmail_semesterName
        const entryGroups = new Map();

        for (const row of responses) {
            const [timestamp, formName, formRollNo, formEmail, formCgpa, formSemester, formDocId] = row;
            if (!formEmail) continue;

            const rowData = {
                formName,
                formEmail,
                formRollNo,
                formCgpa,
                formSemester,
                formDocId
            };

            // Pass 1: DRY RUN to identify the best result without modifying DB/sending email
            const dryRunResult = await verifySingleResponse(rowData, false, true);
            
            if (dryRunResult.docId) {
                const groupKey = dryRunResult.docId.toString();
                
                if (!entryGroups.has(groupKey)) {
                    entryGroups.set(groupKey, { result: dryRunResult, rowData });
                } else {
                    const existing = entryGroups.get(groupKey);
                    // Prioritize "verified" result over "mismatch"
                    if (dryRunResult.status === "verified" && existing.result.status !== "verified") {
                        entryGroups.set(groupKey, { result: dryRunResult, rowData });
                    }
                }
            }
        }

        let syncedCount = 0;
        let verifiedCount = 0;
        let mismatchCount = 0;

        // Pass 2: ACTUAL EXECUTION for the best result only
        for (const [groupKey, entry] of entryGroups.entries()) {
            const finalResult = await verifySingleResponse(entry.rowData, true, false);

            if (finalResult.status === "verified") {
                syncedCount++;
                verifiedCount++;
            } else if (finalResult.status === "mismatch") {
                syncedCount++;
                mismatchCount++;
            }
        }

        res.json({ 
            message: "Sync completed with email prioritization", 
            totalStudentsMatched: entryGroups.size,
            verifiedCount, 
            mismatchCount 
        });

    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).send("Sync failed: " + err.message);
    }
});

module.exports = router;
