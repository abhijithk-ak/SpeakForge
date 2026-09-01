/**
 * AES-256-GCM encryption/decryption for storing API keys securely at rest.
 * The encryption key comes from ENCRYPTION_KEY env variable (32-byte hex string).
 */

const crypto = require('crypto');

const ALGORITHM  = 'aes-256-gcm';
const KEY_LENGTH = 32; // bytes → 256 bits
const IV_LENGTH  = 12; // bytes → 96 bits (recommended for GCM)

/**
 * Derive a 32-byte Buffer from the ENCRYPTION_KEY env variable.
 * Accepts either a 64-char hex string or falls back to SHA-256 of the raw string.
 */
function getDerivedKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.');
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');          // Already a 32-byte hex string
  }
  return crypto.createHash('sha256').update(raw).digest(); // Derive 32 bytes
}

/**
 * Encrypt a plaintext string.
 * Returns a single string: `iv_hex:authTag_hex:ciphertext_hex`
 */
function encrypt(plaintext) {
  const key = getDerivedKey();
  const iv  = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

/**
 * Decrypt a string produced by `encrypt()`.
 * Returns the original plaintext.
 */
function decrypt(encryptedString) {
  const key = getDerivedKey();
  const [ivHex, authTagHex, ciphertextHex] = encryptedString.split(':');

  const iv         = Buffer.from(ivHex,         'hex');
  const authTag    = Buffer.from(authTagHex,    'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
