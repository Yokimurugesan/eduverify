const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const ReferenceDocument = require('../models/ReferenceDocument');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const os = require('os');
const sharp = require('sharp');

const sendEmail = require('../utils/mailer');
const { extractTextFromImage, extractTextFromPDF, parseExtractedText, cgpaOnlyPrompt } = require('../utils/ocrService');
const { generateFormLink } = require('../utils/googleFormService');
const { stampDocument } = require('../utils/stampingService');
const ExtractedData = require('../models/ExtractedData');



// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {

        const { name, email, password, role } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        res.send("User registered successfully");

    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ================= LOGIN =================
router.post('/login', async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user)
            return res.status(404).send("User not found");

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            return res.status(401).send("Invalid password");

        const accessToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, role: user.role },
            process.env.REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        user.refreshToken = refreshToken;
        await user.save();

        res.json({ accessToken, refreshToken });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= REFRESH TOKEN =================
router.post('/refresh', async (req, res) => {

    try {

        const { refreshToken } = req.body;

        if (!refreshToken)
            return res.status(401).send("Refresh token missing");

        const user = await User.findOne({ refreshToken });

        if (!user)
            return res.status(403).send("Invalid refresh token");

        jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err) => {

            if (err)
                return res.status(403).send("Refresh token expired");

            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({ accessToken });

        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= LOGOUT =================
router.post('/logout', auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.send("Logged out successfully");

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});
// Utility to get the verification base URL (supports mobile access)
const getVerificationBaseURL = () => {
    // Priority 1: Environment variable
    if (process.env.FRONTEND_URL) {
        return `${process.env.FRONTEND_URL}/verify?id=`;
    }
    if (process.env.PUBLIC_IP) {
        return `http://${process.env.PUBLIC_IP}:3000/verify?id=`;
    }

    // Priority 2: Dynamic detection
    const interfaces = os.networkInterfaces();
    let foundIPs = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                foundIPs.push(iface.address);
            }
        }
    }

    const realIP = foundIPs.find(ip => 
        (ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) && 
        !ip.startsWith('192.168.137.') && !ip.startsWith('192.168.56.')
    );

    const selectedIP = realIP || foundIPs[0] || 'localhost';
    console.log("Found Network IPs:", foundIPs);
    console.log("Selected IP for QR:", selectedIP);
    
    // Redirect QR scans to the FRONTEND verification page instead of backend API
    return `http://${selectedIP}:3000/verify?id=`;
};

// ================= STUDENT UPLOAD (AUTO-VERIFY AGAINST REFERENCE DB) =================
router.post('/upload', auth, upload.single('file'), async (req, res) => {

    try {
        const { type, semester } = req.body;
        console.log(`[Student Upload] Incoming Semester: "${semester}", Type: "${type}"`);
        const allowedTypes = ["marksheet", "degree_certificate"];

        if (!req.file)
            return res.status(400).send("No file uploaded");

        if (!type)
            return res.status(400).send("Document type required");

        if (!allowedTypes.includes(type))
            return res.status(400).send("Invalid document type");

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const fileBuffer = fs.readFileSync(filePath);

        const hash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

        const reference = await ReferenceDocument.findOne({ hash });
        const user = await User.findById(req.user.id);

        if (reference) {

            // ===== AUTO-VERIFY: Match against admin reference database =====
            if (reference.studentEmail.toLowerCase() === user.email.toLowerCase()) {
                const newDocId = new mongoose.Types.ObjectId();
                const verificationBaseURL = getVerificationBaseURL();
                const finalURL = `${verificationBaseURL}${newDocId}`;
                const qrCode = await QRCode.toDataURL(finalURL);
                
                let finalFileName = req.file.filename;
                let verifiedHash = hash;

                // QR Embedding Logic (Restored)
                const mimetype = req.file.mimetype;
                const isPDF = mimetype === "application/pdf";
                const isImage = mimetype.startsWith("image/");

                if (isPDF || isImage) {
                    try {
                        let pdfDoc;
                        let firstPage;
                        let pageWidth, pageHeight;

                        if (isPDF) {
                            const existingPdfBytes = fs.readFileSync(filePath);
                            pdfDoc = await PDFDocument.load(existingPdfBytes);
                            const pages = pdfDoc.getPages();
                            firstPage = pages[0];
                            const size = firstPage.getSize();
                            pageWidth = size.width;
                            pageHeight = size.height;
                        } else {
                            pdfDoc = await PDFDocument.create();
                            const imageBuffer = fs.readFileSync(filePath);
                            const pngBuffer = await sharp(imageBuffer)
                                .flatten({ background: { r: 255, g: 255, b: 255 } })
                                .png()
                                .toBuffer();
                                
                            const embeddedImage = await pdfDoc.embedPng(pngBuffer);
                            const { width: imgW, height: imgH } = embeddedImage.scale(1);
                            const page = pdfDoc.addPage([imgW + 100, imgH + 200]);
                            pageWidth = imgW + 100;
                            pageHeight = imgH + 200;
                            
                            page.drawText(`OFFICIAL VERIFIED RECORD: ${type.toUpperCase()}`, {
                                x: 50,
                                y: pageHeight - 50,
                                size: 18,
                                color: rgb(0, 0, 0.5)
                            });
                            
                            page.drawImage(embeddedImage, {
                                x: 50,
                                y: 120,
                                width: imgW,
                                height: imgH,
                            });
                            
                            firstPage = page;
                        }

                        const qrImageBytes = Buffer.from(qrCode.split(',')[1], 'base64');
                        const qrImage = await pdfDoc.embedPng(qrImageBytes);

                        firstPage.drawImage(qrImage, {
                            x: pageWidth - 140,
                            y: 30,
                            width: 100,
                            height: 100,
                        });

                        const pdfBytes = await pdfDoc.save();
                        finalFileName = `verified_${Date.now()}_${req.file.originalname.split('.')[0]}.pdf`;
                        const verifiedFilePath = path.join(__dirname, '../uploads', finalFileName);
                        fs.writeFileSync(verifiedFilePath, Buffer.from(pdfBytes));
                        verifiedHash = crypto.createHash('sha256').update(pdfBytes).digest('hex');
                    } catch (pdfErr) {
                        console.error("[Auto-Verify] PDF embedding failed:", pdfErr.message);
                    }
                }

                // --- Phase 2: Professional Vault Stamping (Auto-Verify) ---
                const stampedResult = await stampDocument(filePath, qrCode, {
                    docId: newDocId, 
                    studentName: reference.studentName || user.name
                });

                const doc = new Document({
                    _id: newDocId,
                    userId: req.user.id,
                    fileName: stampedResult.fileName,
                    originalName: req.file.originalname,
                    type: type,
                    semester: semester || null,
                    hash,
                    qrCode,
                    verificationURL: finalURL,
                    verifiedDocHash: stampedResult.hash,
                    status: "verified",
                    verifiedBy: "auto"
                });
                await doc.save();

                // Create ExtractedData for comparison (using data from official reference)
                await ExtractedData.create({
                    docId: doc._id,
                    studentName: reference.studentName,
                    cgpa: reference.cgpa,
                    extractedSemester: reference.semester,
                    semesterWiseDetails: reference.semesterWiseData || [],
                    formStatus: "sent",
                    verificationMethod: "auto"
                });

                // Generate Google Form Link
                const formLink = generateFormLink({
                    name: user.name,
                    email: user.email,
                    semester: semester || ""
                });

                // Send Unified Email
                try {
                    const attachments = [{
                        filename: `VERIFIED_${req.file.originalname.split('.')[0]}.pdf`,
                        path: path.join(__dirname, '../uploads', finalFileName)
                    }];

                    await sendEmail(
                        user.email,
                        "Document Verified Successfully! ✅",
                        `Hello ${user.name},\n\nYour ${type} has been auto-verified against our official records.\n\nYour verified document with an embedded QR code is attached.\n\nAs an additional cross-validation step, please fill out this form to confirm your final CGPA:\n\n👉 ${formLink}`,
                        attachments
                    );
                } catch (emailErr) {
                    console.error("[Auto-Verify] Email failed:", emailErr.message);
                }

                return res.status(201).json({
                    message: "Document auto-verified and emailed with QR-coded PDF and link.",
                    docId: doc._id,
                    status: "verified",
                    formLink
                });

            } else {
                return res.status(400).json({
                    message: "Document hash matches an official record, but it is registered to a different student email.",
                    status: "rejected"
                });
            }
        } else if (type === "marksheet") {
            // ===== PENDING FLOW: No official record match — Save for Admin AI Extraction =====
            try {
                const doc = new Document({
                    userId: req.user.id,
                    fileName: req.file.filename,
                    originalName: req.file.originalname,
                    type: type,
                    semester: semester || null,
                    hash,
                    status: "pending",
                    verifiedBy: "auto"
                });
                await doc.save();

                return res.status(201).json({
                    message: "Document uploaded successfully. It is now pending verification.",
                    docId: doc._id,
                    status: "pending"
                });

            } catch (err) {
                console.error("[Student Upload] Failed to save document:", err.message);
                return res.status(500).send("Server error during upload.");
            }
        } else {
            // General rejection for other types if not matched
            return res.status(400).json({
                message: "Official record not found and automated extraction not supported for this document type.",
                status: "rejected"
            });
        }



    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});

// ================= ADMIN VERIFY =================
router.patch('/verify/:id', auth, async (req, res) => {

    try {

        const { action, reason } = req.body;

        const doc = await Document.findById(req.params.id);

        if (!doc)
            return res.status(404).send("Document not found");

        if (req.user.role !== 'admin')
            return res.status(403).send("Access denied");

        if (action === 'verify') {
            doc.status = "verified";
        }

        else if (action === 'reject') {
            doc.status = "rejected";
            doc.rejectionReason = reason || "No reason provided";
        }

        else {
            return res.status(400).send("Invalid action");
        }

        await doc.save();

        let verificationURL = null;
        let qrCode = null;

        if (doc.status === "verified") {
            const verificationBaseURL = getVerificationBaseURL();
            verificationURL = `${verificationBaseURL}${doc._id}`;
            qrCode = await QRCode.toDataURL(verificationURL);
            
            // --- Phase 2: Professional Vault Stamping (Manual-Verify) ---
            const user = await User.findById(doc.userId);
            const filePath = path.join(__dirname, '../uploads', doc.fileName);
            
            try {
                const stampedResult = await stampDocument(filePath, qrCode, {
                    docId: doc._id,
                    studentName: user.name
                });
                
                doc.fileName = stampedResult.fileName;
                doc.verifiedDocHash = stampedResult.hash;
            } catch (err) {
                console.error("[Manual-Verify] Stamping failed:", err.message);
            }

            doc.qrCode = qrCode;
            doc.verificationURL = verificationURL;
            await doc.save();
        }

        await AuditLog.create({
            docId: doc._id,
            adminId: req.user.id,
            action: doc.status
        });

        await Notification.create({
            userId: doc.userId,
            message: `Your ${doc.type} "${doc.originalName}" was ${doc.status}`
        });

        const user = await User.findById(doc.userId);

        // ===== Flow 2: Send Google Form for CGPA cross-validation (only on verify) =====
        let formLink = null;
        if (doc.status === "verified") {
            try {
                // Look up reference document by hash to get OCR-extracted CGPA
                const refDoc = await ReferenceDocument.findOne({ hash: doc.hash });
                const refCgpa = refDoc ? refDoc.cgpa : null;
                const refName = refDoc ? refDoc.studentName : null;

                // Create ExtractedData record so sync-responses can track and cross-check
                const existingExtracted = await ExtractedData.findOne({ docId: doc._id });
                if (!existingExtracted) {
                    await ExtractedData.create({
                        docId: doc._id,
                        studentName: refName,
                        cgpa: refCgpa,
                        formStatus: "sent"
                    });
                } else {
                    existingExtracted.cgpa = refCgpa;
                    existingExtracted.studentName = refName;
                    existingExtracted.formStatus = "sent";
                    await existingExtracted.save();
                }

                // Generate Google Form link with pre-filled student data
                formLink = generateFormLink({
                    name: refName || user.name,
                    email: user.email,
                    semester: doc.semester || ""
                });
                console.log(`[Admin Verify] Google Form link generated for doc ${doc._id}: ${formLink}`);
            } catch (formErr) {
                console.error("[Admin Verify] Failed to generate form link:", formErr.message);
            }
        }

        // Build the email based on verification status
        let emailSubject, emailBody;
        if (doc.status === "verified") {
            emailSubject = "Document Verified Successfully! ✅";
            emailBody = `Hello ${user.name},\n\nYour ${doc.type} "${doc.originalName}" has been verified by our admin.\n\n` +
                `As an additional cross-validation step, please fill in the following form with your details (especially your CGPA). This helps us ensure the accuracy of your records:\n\n` +
                `👉 ${formLink}\n\n` +
                `Please complete this form at your earliest convenience.\n\nThank you,\nEduVerify Team`;
        } else {
            emailSubject = "Document Verification Status";
            emailBody = `Hello ${user.name},\n\nYour ${doc.type} "${doc.originalName}" has been ${doc.status}.\n\nReason for rejection: ${doc.rejectionReason}\n\nThank you for using EduVerify.`;
        }

        await sendEmail(user.email, emailSubject, emailBody);

        res.json({
            message: `Document ${doc.status}`,
            docId: doc._id,
            qrCode,
            verificationURL,
            formLink
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= PUBLIC VERIFY (ID or FILE + EMAIL) =================
router.post('/public-verify', upload.single('file'), async (req, res) => {

    try {

        const { id, email } = req.body;

        if (!email)
            return res.status(400).send("Student email is required for verification.");

        let doc = null;

        // 1. Verify by File Upload (Hash check)
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            const fileBuffer = fs.readFileSync(filePath);
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            console.log("Checking Public Verification for File:");
            console.log("- Uploaded File Hash:", hash);
            console.log("- Provided Email:", email);

            // Search for a verified document with EITHER original hash OR verified hash
            doc = await Document.findOne({ 
                $or: [{ hash: hash }, { verifiedDocHash: hash }],
                status: "verified" 
            }).populate("userId", "name email");

            if (doc) {
                console.log("- Found Document in DB:");
                console.log("  - DB Original Hash:", doc.hash);
                console.log("  - DB Verified Hash:", doc.verifiedDocHash);
                console.log("  - DB Owner Email:", doc.userId.email);
            } else {
                console.log("- No matching document found for this hash.");
            }
        } 
        // 2. Verify by Document ID
        else if (id) {
            if (mongoose.Types.ObjectId.isValid(id) && String(id).length === 24) {
                doc = await Document.findById(id).populate("userId", "name email");
            } else {
                doc = await Document.findOne({ 
                    $or: [
                        { fileName: id },
                        { verificationURL: { $regex: id } }
                    ]
                }).populate("userId", "name email");
            }
        }

        // 3. Fallback: If document not in student uploads, check administrator reference database
        if (!doc && req.file) {
            const fileHash = crypto.createHash('sha256').update(fs.readFileSync(req.file.path)).digest('hex');
            console.log("- Checking ReferenceDocument fallback:");
            console.log("  - Hash to search:", fileHash);
            console.log("  - Email to search:", email);
            
            const refDoc = await ReferenceDocument.findOne({ 
                hash: fileHash,
                studentEmail: { $regex: new RegExp(`^${email.trim()}$`, 'i') }
            });

            if (refDoc) {
                console.log("- Found in ReferenceDocument!");
                return res.json({
                    valid: true,
                    studentName: refDoc.studentName,
                    email: refDoc.studentEmail,
                    documentType: refDoc.type,
                    fileName: refDoc.originalName,
                    verifiedOn: refDoc.uploadedAt,
                    institution: 'Verified Institution (Official Record)'
                });
            } else {
                console.log("- STILL not found in ReferenceDocument.");
            }
        }

        if (!doc)
            return res.status(404).send("Document not found or not verified.");

        if (doc.status !== "verified")
            return res.json({ valid: false, message: "Document exists but is not verified." });

        // 3. Identity Check: Compare provided email with document owner's email
        if (doc.userId.email.toLowerCase() !== email.toLowerCase()) {
            return res.status(401).json({ 
                valid: false, 
                message: "Security breach: This document does not belong to the provided student email." 
            });
        }

        res.json({
            valid: true,
            studentName: doc.userId.name,
            email: doc.userId.email,
            documentType: doc.type,
            fileName: doc.originalName,
            verifiedOn: doc.updatedAt || doc.createdAt,
            institution: 'Verified Institution'
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});


// ================= QR SCAN =================
router.get('/scan/:id', async (req, res) => {

    try {

        let doc = null;
        
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            doc = await Document.findById(req.params.id).populate("userId", "name email");
        } else {
            // Fallback for older QR codes that embedded the filename instead of the document ID
            doc = await Document.findOne({ verificationURL: { $regex: req.params.id } }).populate("userId", "name email");
        }

        if (!doc)
            return res.status(404).send("Document not found");

        if (doc.status !== "verified") {

            return res.json({
                valid: false,
                message: "Document is not verified"
            });

        }

        res.json({

            valid: true,
            studentName: doc.userId.name,
            email: doc.userId.email,
            documentType: doc.type,
            fileName: doc.originalName,
            verifiedStatus: doc.status

        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= CHECK INTEGRITY =================
router.get('/check-integrity/:id', async (req, res) => {

    try {

        const doc = await Document.findById(req.params.id);

        if (!doc)
            return res.status(404).send("Document not found");

        const filePath = path.join(__dirname, '../uploads', doc.fileName);

        if (!fs.existsSync(filePath))
            return res.status(404).send("File missing");

        const fileBuffer = fs.readFileSync(filePath);

        const newHash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

        if (newHash === doc.hash) {
            res.json({ integrity: "VALID", message: "Document not tampered" });
        } else {
            res.json({ integrity: "TAMPERED", message: "Document modified" });
        }

    } catch (err) {
        res.status(500).send("Server error");
    }

});


// ================= USER NOTIFICATIONS =================
router.get('/notifications', auth, async (req, res) => {

    try {

        const notifications = await Notification
            .find({ userId: req.user.id })
            .sort({ timestamp: -1 });

        res.json(notifications);

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= USER DOCUMENTS =================
router.get('/documents', auth, async (req, res) => {

    const docs = await Document.find({ userId: req.user.id }).populate('extractedData');

    res.json(docs);

});



// ================= ADMIN PROCESS OCR =================
router.post('/admin/process-ocr/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin')
            return res.status(403).send("Admin only");

        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).send("Document not found");

        const user = await User.findById(doc.userId);
        if (!user) return res.status(404).send("User not found");

        console.log(`[Admin OCR] Starting extraction for ${doc.fileName}...`);
        const filePath = path.join(__dirname, '../uploads', doc.fileName);
        const mimetype = doc.fileName.endsWith('.pdf') ? "application/pdf" : "image/jpeg";

        let ocrResult;
        if (mimetype === "application/pdf") {
            ocrResult = await extractTextFromPDF(filePath);
        } else {
            ocrResult = await extractTextFromImage(filePath);
        }

        // Create or update ExtractedData
        let extracted = await ExtractedData.findOne({ docId: doc._id });
        if (!extracted) {
            extracted = new ExtractedData({ docId: doc._id });
        }
        extracted.studentName = ocrResult.name;
        extracted.cgpa = ocrResult.cgpa;
        extracted.extractedSemester = ocrResult.semester;
        extracted.semesterWiseDetails = ocrResult.semesterWiseDetails || [];
        extracted.formStatus = "sent";
        extracted.verificationMethod = "auto";
        await extracted.save();

        // Update document to show it is waiting for form
        doc.status = "pending"; // Keep as pending but we could add a sub-status
        await doc.save();

        // Generate PRE-FILLED Form Link
        const formLink = generateFormLink({
            name: ocrResult.name || user.name,
            email: user.email,
            semester: doc.semester || ""
        });

        // Send Email
        await sendEmail(
            user.email,
            "Action Required: Verify Your Document CGPA",
            `Hello ${user.name},\n\nOur system has processed your ${doc.type}.\n\nTo complete verification, please confirm your CGPA via this form:\n\n👉 ${formLink}`
        );

        res.json({
            message: "AI Extraction complete and email sent to student.",
            ocrData: ocrResult,
            formLink
        });

    } catch (err) {
        console.error("[Admin OCR Error]", err);
        res.status(500).send("OCR Processing failed: " + err.message);
    }
});

// ================= ADMIN DOCUMENT LIST =================
router.get('/admin/documents', auth, async (req, res) => {


    try {

        if (req.user.role !== "admin")
            return res.status(403).send("Admin access only");

        const { page = 1, limit = 5, status, type } = req.query;

        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const documents = await Document
            .find(query)
            .populate('userId', 'name email')
            .populate('extractedData')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Document.countDocuments(query);

        res.json({
            totalDocuments: total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            documents
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= ADMIN UPLOAD REFERENCE DOCUMENT =================
router.post('/admin/upload-reference', auth, upload.single('file'), async (req, res) => {

    try {

        if (req.user.role !== 'admin')
            return res.status(403).send("Admin access only");
        
        const { type, studentEmail, studentName, cgpa, semester } = req.body;
        console.log(`[Admin Reference Upload] Received Payload:`, JSON.stringify(req.body));
        
        const finalSemester = semester || "Semester 1"; 
        console.log(`[Admin Reference Upload] Using Semester: "${finalSemester}", Email: "${studentEmail}"`);

        if (!req.file)
            return res.status(400).send("No file uploaded");

        if (!type || !studentEmail)
            return res.status(400).send("type and studentEmail are required");

        const allowedTypes = ["marksheet", "degree_certificate"];
        if (!allowedTypes.includes(type))
            return res.status(400).send("Invalid document type");

        const filePath = path.join(__dirname, '../uploads', req.file.filename);
        const fileBuffer = fs.readFileSync(filePath);

        const hash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

        // Check if this reference already exists
        const existing = await ReferenceDocument.findOne({ hash });
        if (existing) {
            return res.status(409).json({
                message: "This document is already in the reference database",
                existingRef: existing._id
            });
        }

        // ===== OCR: Fetch ONLY CGPA (Admin manually types the name) =====
        let extractedName = studentName || null;
        let extractedCgpa = cgpa || null;
        let extractedSemesterWiseData = [];
        
        // Only run OCR for CGPA if missing. We NO LONGER auto-extract names for references.
        if (!extractedCgpa) {
            console.log(`[Admin Reference] Manually typed name: ${extractedName}. Fetching ONLY CGPA via OCR...`);
            try {

                console.log("[Admin Ref Upload] Running OCR as fallback...");
                let parsed = { name: null, cgpa: null };
                const mimetype = req.file.mimetype;
                if (mimetype === "application/pdf") {
                    parsed = await extractTextFromPDF(filePath, cgpaOnlyPrompt);
                } else if (mimetype.startsWith("image/")) {
                    parsed = await extractTextFromImage(filePath, cgpaOnlyPrompt);
                }
                extractedCgpa = parsed.cgpa;
                extractedSemesterWiseData = parsed.semesterWiseDetails || [];
                console.log(`[Admin Ref Upload] OCR Result: CGPA=${extractedCgpa}, Semesters=${extractedSemesterWiseData.length}`);
            } catch (ocrErr) {
                console.error("[Admin Ref Upload] OCR failed:", ocrErr.message);
            }
        }

        const refDoc = new ReferenceDocument({
            adminId: req.user.id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            type,
            semester: finalSemester,
            hash,
            studentName: extractedName || "Unknown",
            studentEmail,
            cgpa: extractedCgpa,
            semesterWiseData: extractedSemesterWiseData || []
        });

        await refDoc.save();

        res.status(201).json({
            message: "Reference document uploaded successfully",
            refId: refDoc._id,
            hash,
            studentName: extractedName || "Unknown",
            cgpa: extractedCgpa,
            type
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});


// ================= ADMIN LIST REFERENCES =================
router.get('/admin/references', auth, async (req, res) => {

    try {

        if (req.user.role !== 'admin')
            return res.status(403).send("Admin access only");

        const { page = 1, limit = 20 } = req.query;

        const references = await ReferenceDocument
            .find()
            .populate('adminId', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ uploadedAt: -1 });

        const total = await ReferenceDocument.countDocuments();

        res.json({
            totalReferences: total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            references
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }

});


// ================= DELETE DOCUMENT =================
router.delete('/documents/:id', auth, async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).send("Document not found");

        // Permission check: Student can only delete their own, Admin can delete any
        if (req.user.role !== 'admin' && doc.userId.toString() !== req.user.id) {
            return res.status(403).send("Access denied");
        }

        // Delete the file from filesystem
        const filePath = path.join(__dirname, '../uploads', doc.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Document.findByIdAndDelete(req.params.id);
        
        // Also delete related audit logs and notifications
        await AuditLog.deleteMany({ docId: doc._id });

        res.send("Document deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ================= DELETE REFERENCE DOCUMENT =================
router.delete('/admin/references/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Admin access only");

        const ref = await ReferenceDocument.findById(req.params.id);
        if (!ref) return res.status(404).send("Reference document not found");

        // Delete the file from filesystem
        const filePath = path.join(__dirname, '../uploads', ref.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await ReferenceDocument.findByIdAndDelete(req.params.id);

        res.send("Reference document deleted successfully");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ================= ADMIN COMPARISON DATA =================
router.get('/comparison/:docId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Admin access only");

        const doc = await Document.findById(req.params.docId)
            .populate('userId', 'name email')
            .populate('extractedData');

        if (!doc) return res.status(404).send("Document not found");

        res.json({
            docId: doc._id,
            studentDetail: {
                name: doc.userId?.name || "Unknown",
                email: doc.userId?.email || "N/A",
                uploadedAt: doc.createdAt
            },
            ocrData: doc.extractedData ? {
                name: doc.extractedData.studentName,
                cgpa: doc.extractedData.cgpa,
                semester: doc.extractedData.extractedSemester,
                semesterWise: doc.extractedData.semesterWiseDetails
            } : null,
            formData: doc.extractedData ? doc.extractedData.formData : null,
            status: doc.status,
            rejectionReason: doc.rejectionReason,
            formStatus: doc.extractedData ? doc.extractedData.formStatus : "none"
        });

    } catch (err) {
        console.error("Comparison Error:", err);
        res.status(500).send("Failed to fetch comparison data");
    }
});

// ================= PROFILE =================
router.get('/profile', auth, async (req, res) => {

    const user = await User
        .findById(req.user.id)
        .select('-password -refreshToken');

    res.json(user);

});

module.exports = router;