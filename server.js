require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./models/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Get BASE_URL - use Render URL in production
const BASE_URL = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL || `http://localhost:${PORT}`;

// Make BASE_URL available to routes
app.locals.baseUrl = BASE_URL;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false // Allow inline scripts for demo
}));

app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});

// WhatsApp redirect route: opens WhatsApp with prefilled message containing shareId
app.get('/w/:shareId', async (req, res) => {
    const { shareId } = req.params;
    try {
        const share = await db.getShare(shareId);
        if (!share) {
            return res.status(404).send('Share not found or expired');
        }
        await db.trackEvent('wa_redirect', shareId, req.get('user-agent'), req.ip);

        const waNumber = process.env.WHATSAPP_BUSINESS_NUMBER; // in international format without +
        const baseUrl = req.app.locals.baseUrl;
        const shareUrl = `${baseUrl}/share/${shareId}`;
        const text = encodeURIComponent(`Hi\nSHARE ${shareId}\n${shareUrl}`);

        if (!waNumber) {
            // Fallback to generic wa.me link without number
            return res.redirect(`https://wa.me/?text=${text}`);
        }
        return res.redirect(`https://wa.me/${waNumber}?text=${text}`);
    } catch (error) {
        console.error('WA redirect error:', error);
        return res.status(500).send('Error');
    }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/download', require('./routes/download'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

// Share page route
app.get('/share/:shareId', async (req, res) => {
    const { shareId } = req.params;

    try {
        // Verify share exists
        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).send('Share not found or expired');
        }

        // Track QR scan
        await db.trackEvent('qr_scan', shareId, req.get('user-agent'), req.ip);

        // Serve download page
        res.sendFile(path.join(__dirname, 'public', 'download.html'));

    } catch (error) {
        console.error('Share page error:', error);
        res.status(500).send('Error loading share');
    }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cleanup expired shares periodically
setInterval(async () => {
    try {
        await db.cleanupExpired();
        console.log('✓ Cleaned up expired shares');
    } catch (error) {
        console.error('Error cleaning up expired shares:', error);
    }
}, 3600000); // Every hour

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   QR Document Delivery System                 ║
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Server: ${BASE_URL}
║   Port: ${PORT}
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    db.close();
    process.exit(0);
});
