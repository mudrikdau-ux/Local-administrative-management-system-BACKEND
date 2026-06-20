const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profiles/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = 'profile_' + Date.now() + '_' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, and PNG files are allowed.'), false);
    }
};

const profileUpload = multer({
    storage: storage,
    limits: { 
        fileSize: 2 * 1024 * 1024 // 2MB max
    },
    fileFilter: fileFilter
});

module.exports = profileUpload;