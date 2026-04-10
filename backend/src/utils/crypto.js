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
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = { encrypt, decrypt };
