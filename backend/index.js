const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load .env variables

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

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

// ================== ROUTES ==================
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

// ✅ Default route
app.get('/', (req, res) => {
    res.send("Server running on http://localhost:" + process.env.PORT);
});

// ================== START SERVER ==================
async function startServer() {
    await connectDB();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
}

startServer();