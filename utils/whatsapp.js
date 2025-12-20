const BASE_GRAPH_URL = 'https://graph.facebook.com/v20.0';

function getConfig() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) {
        throw new Error('Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    }
    return { token, phoneNumberId };
}

async function sendText(to, body) {
    const { token, phoneNumberId } = getConfig();
    const url = `${BASE_GRAPH_URL}/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`WhatsApp sendText failed: ${res.status} ${text}`);
    }
    return res.json();
}

async function sendDocument(to, link, filename) {
    const { token, phoneNumberId } = getConfig();
    const url = `${BASE_GRAPH_URL}/${phoneNumberId}/messages`;
    const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
            link,
            filename
        }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`WhatsApp sendDocument failed: ${res.status} ${text}`);
    }
    return res.json();
}

module.exports = {
    sendText,
    sendDocument
};
