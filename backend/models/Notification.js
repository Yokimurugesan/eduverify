const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    message: String,

    timestamp: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Notification", notificationSchema);