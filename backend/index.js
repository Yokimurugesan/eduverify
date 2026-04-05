const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Added for path.join
require('dotenv').config(); // Load .env variables
const Document = require('./models/Document');
const auth = require('./middleware/auth');
const ExtractedData = require('./models/ExtractedData');
const User = require('./models/User'); 

console.log("🚀 [EduVerify] Booting with Direct Comparison Routes enabled...");
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
// app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // DISABLING PUBLIC ACCESS FOR SECURITY

// ================== DATABASE CONNECTION ==================
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.error("DB connection error:", err.message);
        process.exit(1);
    }
}

// ================== HEALTH CHECK ==================
app.get('/api/health-check', (req, res) => {
    res.json({ status: "alive", version: "1.2", timestamp: new Date() });
});

// ================== DIRECT COMPARISON ROUTE (Check This First) ==================
const handleComparison = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).send("Admin access only");
        
        const doc = await Document.findById(req.params.docId)
            .populate('userId', 'name email')
            .populate('extractedData');

        if (!doc) return res.status(404).send("Document not found");

        res.json({
            docId: doc._id,
            studentDetail: {
                name: doc.userId?.name || "Unknown Student",
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
            fileName: doc.fileName,
            rejectionReason: doc.rejectionReason,
            formStatus: doc.extractedData ? doc.extractedData.formStatus : "none"
        });

    } catch (err) {
        console.error("Comparison Error:", err);
        res.status(500).send("Failed to fetch comparison data");
    }
};

app.get('/api/comparison/:docId', auth, handleComparison);
app.get('/api/forms/comparison/:docId', auth, handleComparison);

// ================== SECURE FILE ACCESS (Security Enhancement) ==================
app.get('/api/files/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const token = req.query.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
        
        if (!token) return res.status(401).send("Authentication required to access student documents.");

        // Manual JWT check to support query params
        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).send("Invalid or expired session token.");
        }

        const doc = await Document.findOne({ fileName: filename });
        if (!doc) return res.status(404).send("Document not found in vault.");

        // Security Check: Only owner or admin
        if (decoded.role !== 'admin' && doc.userId.toString() !== decoded.id) {
            return res.status(403).send("Vault Security: Unauthorized access.");
        }

        const filePath = path.join(__dirname, 'uploads', filename);
        if (!require('fs').existsSync(filePath)) {
            return res.status(404).send("Physical evidence missing.");
        }

        res.sendFile(filePath);
    } catch (err) {
        res.status(500).send("Internal Vault Error.");
    }
});

// ================== OTHER ROUTERS ==================
const userRoutes = require('./routes/userRoutes');
const formRoutes = require('./routes/formRoutes');

app.use('/api/forms', formRoutes);
app.use('/api', userRoutes);

// ✅ Default route
app.get('/', (req, res) => {
    res.send("Server running on http://localhost:" + process.env.PORT);
});

// ================== START SERVER ==================
async function startServer() {
    await connectDB();
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server started on http://0.0.0.0:${port}`);
        console.log(`Access locally: http://localhost:${port}`);
    });
}

startServer();