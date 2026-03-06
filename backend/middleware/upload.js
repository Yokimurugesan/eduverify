const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname,'../uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

module.exports = multer({ storage });