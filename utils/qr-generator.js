const QRCode = require('qrcode');

/**
 * Generate a QR code as a data URL
 * @param {string} url - The URL to encode
 * @param {object} options - QR code options
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
async function generateQRCode(url, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.95,
        margin: 2,
        width: 400,
        color: {
            dark: options.darkColor || '#000000',
            light: options.lightColor || '#FFFFFF'
        }
    };

    try {
        const qrDataURL = await QRCode.toDataURL(url, defaultOptions);
        return qrDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Generate QR code as buffer (for saving to file)
 */
async function generateQRBuffer(url, options = {}) {
    const defaultOptions = {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 400
    };

    try {
        const buffer = await QRCode.toBuffer(url, defaultOptions);
        return buffer;
    } catch (error) {
        console.error('Error generating QR buffer:', error);
        throw error;
    }
}

module.exports = {
    generateQRCode,
    generateQRBuffer
};
