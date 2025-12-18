const express = require('express');
const router = express.Router();
const db = require('../models/database');

/**
 * GET /api/analytics/:shareId
 * Get analytics for a share
 */
router.get('/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;

        // Get share
        const share = await db.getShare(shareId);

        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }

        // Get analytics
        const analytics = await db.getAnalytics(shareId);

        // Format analytics
        const stats = {
            shareId,
            createdAt: share.created_at,
            expiresAt: share.expires_at,
            events: {}
        };

        analytics.forEach(row => {
            stats.events[row.event_type] = {
                count: row.count,
                lastEvent: row.last_event
            };
        });

        res.json({
            success: true,
            analytics: stats
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
});

module.exports = router;
