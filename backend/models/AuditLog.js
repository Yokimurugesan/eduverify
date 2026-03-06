const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({

    docId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document"
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    action: String,

    timestamp: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("AuditLog", auditSchema);