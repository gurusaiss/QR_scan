const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const db = require('../models/database');
const { verifyPassword } = require('../utils/token-generator');

/**
 * GET /api/download/:shareId
 * Get share information
 */
router.get('/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;

        // Get share from database
        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }

        // Check expiration
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Share has expired' });
        }

        // Get files
        const files = await db.getFiles(shareId);

        // Track page view
        await db.trackEvent('page_view', shareId, req.get('user-agent'), req.ip);

        res.json({
            success: true,
            brandName: share.brand_name,
            language: share.language,
            requiresPassword: !!share.password_hash,
            fileCount: files.length,
            files: files.map(f => ({
                id: f.id,
                name: f.original_name,
                size: f.file_size,
                type: f.mime_type
            }))
        });

    } catch (error) {
        console.error('Get share error:', error);
        res.status(500).json({ error: 'Failed to retrieve share' });
    }
});

/**
 * POST /api/download/:shareId/verify
 * Verify password for protected share
 */
router.post('/:shareId/verify', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { password } = req.body;

        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }

        if (!share.password_hash) {
            return res.json({ success: true });
        }

        const isValid = await verifyPassword(password, share.password_hash);

        if (isValid) {
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }

    } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

/**
 * GET /api/download/:shareId/zip
 * Download all files as ZIP
 */
router.get('/:shareId/zip', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { password } = req.query;

        // Get share
        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }

        // Check expiration
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Share has expired' });
        }

        // Verify password if required
        if (share.password_hash) {
            if (!password) {
                return res.status(401).json({ error: 'Password required' });
            }
            const isValid = await verifyPassword(password, share.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        // Get files
        const files = await db.getFiles(shareId);

        if (files.length === 0) {
            return res.status(404).json({ error: 'No files found' });
        }

        // Track download
        await db.trackEvent('download_zip', shareId, req.get('user-agent'), req.ip);

        // Set headers
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="files-${shareId}.zip"`);

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ error: 'Failed to create archive' });
        });

        archive.pipe(res);

        // Add files to archive
        const uploadDir = path.join(__dirname, '..', 'uploads');
        for (const file of files) {
            const filePath = path.join(uploadDir, file.stored_name);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: file.original_name });
            }
        }

        await archive.finalize();

    } catch (error) {
        console.error('ZIP download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

/**
 * GET /api/download/:shareId/file/:fileId
 * Download individual file
 */
router.get('/:shareId/file/:fileId', async (req, res) => {
    try {
        const { shareId, fileId } = req.params;
        const { password } = req.query;

        // Get share
        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }

        // Check expiration
        if (share.expires_at && new Date(share.expires_at) < new Date()) {
            return res.status(410).json({ error: 'Share has expired' });
        }

        // Verify password if required
        if (share.password_hash) {
            if (!password) {
                return res.status(401).json({ error: 'Password required' });
            }
            const isValid = await verifyPassword(password, share.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        // Get files
        const files = await db.getFiles(shareId);
        const file = files.find(f => f.id == fileId);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Track download
        await db.trackEvent('download_file', shareId, req.get('user-agent'), req.ip);

        // Send file
        const filePath = path.join(__dirname, '..', 'uploads', file.stored_name);
        res.download(filePath, file.original_name);

    } catch (error) {
        console.error('File download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    }
});

module.exports = router;
