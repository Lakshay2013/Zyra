const crypto = require('crypto');

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ FATAL: ENCRYPTION_KEY environment variable is required. Must be a 64-character hex string (32 bytes).');
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  console.error('❌ FATAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).');
  process.exit(1);
}

const key = Buffer.from(ENCRYPTION_KEY, 'hex');
const CBC_IV_LENGTH = 16; // For AES-CBC legacy ciphertexts
const GCM_IV_LENGTH = 12;
const GCM_PREFIX = 'gcm';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    GCM_PREFIX,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

function decrypt(text) {
  if (!text) return text;
  const textParts = text.split(':');
  if (textParts[0] === GCM_PREFIX) {
    const [, ivHex, authTagHex, encryptedHex] = textParts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // Backward compatibility for provider keys encrypted before AES-GCM.
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
