const mongoose = require('mongoose');

const extractedDataSchema = new mongoose.Schema({
    docId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    studentName: String,
    cgpa: Number,
    extractedSemester: String,
    semesterWiseDetails: [
        {
            semester: String,
            gpa: Number
        }
    ],
    formStatus: {
        type: String,
        enum: ["none", "sent", "confirmed", "mismatch"],
        default: "none"
    },
    formData: {
        studentName: String,
        rollNo: String,
        cgpa: Number,
        email: String,
        semester: String,
        submittedAt: { type: Date, default: Date.now }
    },
    verificationMethod: { type: String, enum: ["auto", "manual"], default: "auto" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ExtractedData", extractedDataSchema);
