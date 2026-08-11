// Secure password hashing using Web Crypto API (SHA-256 + salt)
// This ensures passwords are never stored or compared as plain text.

const SALT_PREFIX = 'sasurie_ssb_salt_';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT_PREFIX + password.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
}
