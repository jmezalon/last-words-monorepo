import { xchacha20poly1305 } from '@noble/ciphers/chacha';

// Simple type for argon2-browser
declare const hash: (options: {
  pass: string;
  salt: string;
  type: number;
  time: number;
  mem: number;
  parallelism: number;
  hashLen: number;
}) => Promise<{ hash: ArrayBuffer }>;

// Use crypto.getRandomValues for random bytes
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export interface EncryptionResult {
  ciphertext: string;
  encryptedCIK: string;
  nonce: string;
}

export interface DecryptionParams {
  ciphertext: string;
  encryptedCIK: string;
  nonce: string;
  userKey: Uint8Array;
}

/**
 * Derives a user key (UK) from password using Argon2id
 */
export async function deriveUserKey(password: string, salt: string): Promise<Uint8Array> {
  const result = await hash({
    pass: password,
    salt: salt,
    type: 2, // Argon2id
    time: 3,
    mem: 65536, // 64MB
    parallelism: 1,
    hashLen: 32,
  });
  
  return new Uint8Array(result.hash);
}

/**
 * Generates a random Content Encryption Key (CIK)
 */
export function generateCIK(): Uint8Array {
  return randomBytes(32);
}

/**
 * Wraps CIK with Master Key XOR User Key (MK⊕UK)
 */
export async function wrapCIK(cik: Uint8Array, masterKey: Uint8Array, userKey: Uint8Array): Promise<string> {
  // XOR master key with user key
  const wrappingKey = new Uint8Array(32);
  for (let i = 0; i < Math.min(32, masterKey.length, userKey.length); i++) {
    wrappingKey[i] = masterKey[i] ^ userKey[i];
  }
  
  // Encrypt CIK with wrapping key using ChaCha20-Poly1305
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(wrappingKey, nonce);
  const encrypted = cipher.encrypt(cik);
  
  // Combine nonce + encrypted CIK and encode as base64
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Unwraps CIK using Master Key XOR User Key (MK⊕UK)
 */
export async function unwrapCIK(encryptedCIK: string, masterKey: Uint8Array, userKey: Uint8Array): Promise<Uint8Array> {
  // Decode base64
  const combined = new Uint8Array(atob(encryptedCIK).split('').map(c => c.charCodeAt(0)));
  
  // Extract nonce and encrypted data
  const nonce = combined.slice(0, 24);
  const encrypted = combined.slice(24);
  
  // XOR master key with user key
  const wrappingKey = new Uint8Array(32);
  for (let i = 0; i < Math.min(32, masterKey.length, userKey.length); i++) {
    wrappingKey[i] = masterKey[i] ^ userKey[i];
  }
  
  // Decrypt CIK
  const cipher = xchacha20poly1305(wrappingKey, nonce);
  return cipher.decrypt(encrypted);
}

/**
 * Encrypts payload with CIK using ChaCha20-Poly1305
 */
export function encryptPayload(payload: string, cik: Uint8Array): { ciphertext: string; nonce: string } {
  const nonce = randomBytes(24);
  const cipher = xchacha20poly1305(cik, nonce);
  const encrypted = cipher.encrypt(new TextEncoder().encode(payload));
  
  return {
    ciphertext: btoa(String.fromCharCode(...encrypted)),
    nonce: btoa(String.fromCharCode(...nonce))
  };
}

/**
 * Decrypts payload with CIK using ChaCha20-Poly1305
 */
export function decryptPayload(ciphertext: string, nonce: string, cik: Uint8Array): string {
  const encryptedData = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
  const nonceData = new Uint8Array(atob(nonce).split('').map(c => c.charCodeAt(0)));
  
  const cipher = xchacha20poly1305(cik, nonceData);
  const decrypted = cipher.decrypt(encryptedData);
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Generates a random salt for key derivation
 */
export function generateSalt(): string {
  const salt = randomBytes(16);
  return btoa(String.fromCharCode(...salt));
}

/**
 * Full encryption flow: derive UK, generate CIK, wrap CIK, encrypt payload
 */
export async function encryptSecret(
  payload: string,
  password: string,
  salt: string,
  masterKey: Uint8Array
): Promise<EncryptionResult> {
  // Derive user key from password
  const userKey = await deriveUserKey(password, salt);
  
  // Generate random CIK
  const cik = generateCIK();
  
  // Wrap CIK with MK⊕UK
  const encryptedCIK = await wrapCIK(cik, masterKey, userKey);
  
  // Encrypt payload with CIK
  const { ciphertext, nonce } = encryptPayload(payload, cik);
  
  return {
    ciphertext,
    encryptedCIK,
    nonce
  };
}

/**
 * Full decryption flow: derive UK, unwrap CIK, decrypt payload
 */
export async function decryptSecret(
  params: DecryptionParams & { password: string; salt: string; masterKey: Uint8Array }
): Promise<string> {
  const { ciphertext, encryptedCIK, nonce, password, salt, masterKey } = params;
  
  // Derive user key from password
  const userKey = await deriveUserKey(password, salt);
  
  // Unwrap CIK
  const cik = await unwrapCIK(encryptedCIK, masterKey, userKey);
  
  // Decrypt payload
  return decryptPayload(ciphertext, nonce, cik);
}
