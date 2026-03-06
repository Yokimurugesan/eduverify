const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const sendEmail = require('../utils/mailer');


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
// ================= UPLOAD DOCUMENT =================
router.post('/upload', auth, upload.single('file'), async (req, res) => {

    try {

        const { type } = req.body;

        const allowedTypes = [
            "marksheet",
            "degree_certificate"
        ];

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

        const doc = new Document({
            userId: req.user.id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            type: type,
            hash,
            status: "pending"
        });

        await doc.save();

        res.status(201).json({
            message: "Document uploaded",
            docId: doc._id,
            type: doc.type,
            hash
        });

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

            verificationURL = `https://project2.loca.lt/api/scan/${doc._id}`;

            qrCode = await QRCode.toDataURL(verificationURL);

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

        await sendEmail(
            user.email,
            "Document Verification Status",
            `Hello ${user.name}, your ${doc.type} "${doc.originalName}" has been ${doc.status}.`
        );

        res.json({
            message: `Document ${doc.status}`,
            docId: doc._id,
            qrCode,
            verificationURL
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server error");

    }

});


// ================= QR SCAN =================
router.get('/scan/:id', async (req, res) => {

    try {

        const doc = await Document
            .findById(req.params.id)
            .populate("userId", "name email");

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

    const docs = await Document.find({ userId: req.user.id });

    res.json(docs);

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


// ================= PROFILE =================
router.get('/profile', auth, async (req, res) => {

    const user = await User
        .findById(req.user.id)
        .select('-password -refreshToken');

    res.json(user);

});

module.exports = router;