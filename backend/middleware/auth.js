const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;

module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).send("Access denied");

    const token = authHeader.split(" ")[1];
    try {
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        console.log("JWT ERROR:", err.message);
        res.status(403).send("Invalid token");
    }
};