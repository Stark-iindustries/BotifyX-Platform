'use strict';

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LEN   = 32;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (raw.length !== KEY_LEN) {
    throw new Error(`ENCRYPTION_KEY must be exactly ${KEY_LEN} characters.`);
  }
  return Buffer.from(raw, 'utf8');
}

/**
 * Encrypt a plaintext string. Returns a string formatted as:
 *   iv_hex:authTag_hex:ciphertext_hex
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv  = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

/**
 * Decrypt a string produced by encrypt().
 */
function decrypt(stored) {
  const key = getKey();
  const [ivHex, authTagHex, ciphertextHex] = stored.split(':');

  const iv         = Buffer.from(ivHex, 'hex');
  const authTag    = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encrypt, decrypt };
