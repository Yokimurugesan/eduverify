const mongoose = require('mongoose');

const referenceDocumentSchema = new mongoose.Schema({
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: String,
    originalName: String,
    type: { 
        type: String, 
        enum: ["marksheet", "degree_certificate"],
        required: true
    },
    semester: {
        type: String,
        enum: ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"],
        required: false
    },
    hash: { type: String, required: true, index: true },  // SHA-256 hash — indexed for fast lookup
    studentName: { type: String, required: false }, // Now manually typed by Admin
    studentEmail: { type: String, required: true, lowercase: true, trim: true },

    cgpa: { type: Number, default: null }, // OCR-extracted CGPA from reference document
    semesterWiseData: [
        {
            semester: String,
            gpa: Number
        }
    ],
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ReferenceDocument", referenceDocumentSchema);
