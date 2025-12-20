const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { sendText } = require('../utils/whatsapp');

// GET /api/whatsapp/webhook - verification
router.get('/webhook', (req, res) => {
    try {
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === verifyToken) {
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    } catch (e) {
        return res.sendStatus(500);
    }
});

// POST /api/whatsapp/webhook - inbound messages
router.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') {
            return res.sendStatus(404);
        }

        const baseUrl = req.app.locals.baseUrl;

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const value = change.value || {};
                const messages = value.messages || [];
                for (const msg of messages) {
                    const from = msg.from; // phone number
                    const name = (msg.profile && msg.profile.name) || '';
                    const text = msg.text && msg.text.body ? msg.text.body : '';

                    // Try to extract shareId from message like: "SHARE <shareId>"
                    let shareId = null;
                    const m = text.match(/SHARE\s+([A-Za-z0-9_-]{6,})/i);
                    if (m) shareId = m[1];

                    // If no shareId was sent, just acknowledge
                    if (!shareId) {
                        await sendText(from, 'Thanks for contacting us. Please send your code or scan our QR again.');
                        continue;
                    }

                    // Validate share exists
                    const share = await db.getShare(shareId);
                    if (!share) {
                        await sendText(from, 'This code is invalid or expired. Please request a new QR.');
                        continue;
                    }

                    // Log analytics: inbound WA message
                    try { await db.trackEvent('wa_inbound', shareId, 'whatsapp', from); } catch { }

                    // Build links
                    const sharePage = `${baseUrl}/share/${shareId}`;
                    const zipLink = `${baseUrl}/api/download/${shareId}/zip`;

                    const hasPassword = !!share.password_hash;
                    const reply = hasPassword
                        ? `Hi${name ? ' ' + name : ''}!\nYour documents are ready.\nOpen: ${sharePage}\nIf prompted, enter your password.\nYou can also download all files as ZIP here: ${zipLink}`
                        : `Hi${name ? ' ' + name : ''}!\nYour documents are ready.\nOpen: ${sharePage}\nOr download all files as ZIP: ${zipLink}`;

                    await sendText(from, reply);
                    try { await db.trackEvent('wa_auto_reply', shareId, 'whatsapp', from); } catch { }
                }
            }
        }

        return res.sendStatus(200);
    } catch (e) {
        console.error('WA webhook error:', e);
        return res.sendStatus(500);
    }
});

module.exports = router;
