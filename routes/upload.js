const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { generateShareId, hashPassword, calculateExpiration } = require('../utils/token-generator');
const { generateQRCode } = require('../utils/qr-generator');
const db = require('../models/database');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600, // 100MB default
        files: 20 // Max 20 files per upload
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'application/zip',
            'application/x-rar-compressed'
        ];

        if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    }
});

/**
 * POST /api/upload
 * Upload multiple files and generate QR code
 */
router.post('/', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Generate unique share ID
        const shareId = generateShareId();

        // Get optional parameters
        const expirationDays = parseInt(req.body.expirationDays) || parseInt(process.env.DEFAULT_EXPIRATION_DAYS) || 7;
        const password = req.body.password;
        const brandName = req.body.brandName || 'QR Document Delivery';
        const language = req.body.language || 'en';

        // Calculate expiration
        const expiresAt = calculateExpiration(expirationDays);

        // Hash password if provided
        const passwordHash = password ? await hashPassword(password) : null;

        // Create share in database
        await db.createShare(shareId, expiresAt, passwordHash, brandName, language);

        // Add files to database
        for (const file of req.files) {
            await db.addFile(
                shareId,
                file.originalname,
                file.filename,
                file.size,
                file.mimetype
            );
        }

        // Generate share URL - use app's base URL
        const baseUrl = req.app.locals.baseUrl;
        const whatsappMode = (process.env.WHATSAPP_DEEPLINK_ENABLED || '').toLowerCase() === 'true';
        const shareUrl = whatsappMode ? `${baseUrl}/w/${shareId}` : `${baseUrl}/share/${shareId}`;

        // Generate QR code (to WA redirect if whatsappMode)
        const qrCode = await generateQRCode(shareUrl);

        // Calculate total size
        const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

        res.json({
            success: true,
            shareId,
            shareUrl,
            qrCode,
            expiresAt,
            fileCount: req.files.length,
            totalSize,
            files: req.files.map(f => ({
                name: f.originalname,
                size: f.size,
                type: f.mimetype
            }))
        });

    } catch (error) {
        console.error('Upload error:', error);

        // Clean up uploaded files on error
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Error deleting file:', unlinkError);
                }
            }
        }

        res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
});

module.exports = router;
