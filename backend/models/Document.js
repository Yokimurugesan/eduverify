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
    hash: String,               // SHA-256 hash for integrity
    status: { 
        type: String, 
        enum: ["pending", "verified", "rejected"], 
        default: "pending" 
    },
    rejectionReason: String,
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Document", documentSchema);