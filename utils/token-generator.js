const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Generate a cryptographically secure random share ID
 */
function generateShareId(length = 12) {
    return crypto.randomBytes(length).toString('base64url').substring(0, length);
}

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
    if (!password) return null;
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
    if (!password || !hash) return false;
    return await bcrypt.compare(password, hash);
}

/**
 * Calculate expiration date from days
 */
function calculateExpiration(days) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    return expirationDate.toISOString();
}

module.exports = {
    generateShareId,
    hashPassword,
    verifyPassword,
    calculateExpiration
};
