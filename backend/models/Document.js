const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileName: String,          // stored file on server
    originalName: String,      // original file name
    type: { 
        type: String, 
        enum: ["marksheet", "degree_certificate"], // only these two types
        required: true
    },
    semester: {
        type: String,
        enum: ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"],
        required: false // Optional for backward compatibility, but front-end will send it
    },
    hash: String,               // SHA-256 hash for integrity
    status: { 
        type: String, 
        enum: ["pending", "verified", "rejected"], 
        default: "pending" 
    },
    rejectionReason: String,
    qrCode: String,             // QR code data URL (auto-generated on verify)
    verificationURL: String,    // public verification link
    verifiedBy: { 
        type: String, 
        enum: ["auto", "admin"], 
        default: "auto" 
    },
    verifiedDocHash: String,    // Hash of the document AFTER QR embedding
    uploadedAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

documentSchema.virtual('extractedData', {
    ref: 'ExtractedData',
    localField: '_id',
    foreignField: 'docId',
    justOne: true
});

module.exports = mongoose.model("Document", documentSchema);