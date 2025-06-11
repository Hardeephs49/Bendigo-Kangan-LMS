const express = require('express');
const router = express.Router();
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
});

// Handle file uploads for student submissions
router.post('/', upload.array('file'), async (req, res) => {
    console.log(`[UPLOADS ROUTER DEBUG] req.path: ${req.path}, req.originalUrl: ${req.originalUrl}`);
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const fileUrls = req.files.map(file => ({
            title: file.originalname,
            fileUrl: `/uploads/${file.filename}`
        }));

        res.json(fileUrls);
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 