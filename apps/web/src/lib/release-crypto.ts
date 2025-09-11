import { deriveUserKey, unwrapCIK, decryptPayload } from './crypto';

/**
 * Derives Release Key (RK) from release passphrase using PBKDF2
 * This matches the server-side implementation for consistency
 */
export async function deriveReleaseKey(
  releasePassphrase: string,
  willId: string
): Promise<Uint8Array> {
  const salt = 'release-salt-' + willId;
  return await deriveUserKey(releasePassphrase, salt);
}

/**
 * Combines Master Key with Release Key using XOR operation
 * This reconstructs the original Master Key from MK⊕RK
 */
export function combineKeys(
  combinedKeyBase64: string,
  releaseKey: Uint8Array
): Uint8Array {
  // Decode the combined key (MK⊕RK)
  const combinedKey = new Uint8Array(
    atob(combinedKeyBase64)
      .split('')
      .map(c => c.charCodeAt(0))
  );

  // XOR with release key to get master key
  const masterKey = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    masterKey[i] = combinedKey[i] ^ releaseKey[i];
  }

  return masterKey;
}

/**
 * Decrypts a secret using the release flow
 */
export async function decryptSecretWithReleaseKey(
  encryptedSecret: {
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
  },
  masterKey: Uint8Array,
  releasePassphrase: string,
  willId: string
): Promise<string> {
  // Derive user key from release passphrase
  const userKey = await deriveReleaseKey(releasePassphrase, willId);

  // Unwrap CIK using master key and user key
  const cik = await unwrapCIK(encryptedSecret.encryptedCIK, masterKey, userKey);

  // Decrypt the content
  return decryptPayload(encryptedSecret.ciphertext, encryptedSecret.nonce, cik);
}

/**
 * Batch decrypt multiple secrets for the release flow
 */
export async function decryptAllSecrets(
  encryptedSecrets: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
    createdAt: string;
  }>,
  combinedKeyBase64: string,
  releasePassphrase: string,
  willId: string
): Promise<Array<{
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}>> {
  // Derive release key
  const releaseKey = await deriveReleaseKey(releasePassphrase, willId);
  
  // Combine keys to get master key
  const masterKey = combineKeys(combinedKeyBase64, releaseKey);

  const decryptedSecrets = [];

  for (const secret of encryptedSecrets) {
    try {
      // Skip secrets without proper encryption data
      if (!secret.encryptedCIK || !secret.ciphertext || !secret.nonce) {
        decryptedSecrets.push({
          id: secret.id,
          title: secret.title,
          description: secret.description,
          category: secret.category,
          tags: secret.tags,
          content: '[Content not available - missing encryption data]',
          createdAt: secret.createdAt,
        });
        continue;
      }

      const decryptedContent = await decryptSecretWithReleaseKey(
        {
          encryptedCIK: secret.encryptedCIK,
          ciphertext: secret.ciphertext,
          nonce: secret.nonce,
        },
        masterKey,
        releasePassphrase,
        willId
      );

      decryptedSecrets.push({
        id: secret.id,
        title: secret.title,
        description: secret.description,
        category: secret.category,
        tags: secret.tags,
        content: decryptedContent,
        createdAt: secret.createdAt,
      });
    } catch (error) {
      console.error('Failed to decrypt secret:', secret.id, error);
      
      // Include failed secrets with error message
      decryptedSecrets.push({
        id: secret.id,
        title: secret.title,
        description: secret.description,
        category: secret.category,
        tags: secret.tags,
        content: '[Decryption failed - invalid passphrase or corrupted data]',
        createdAt: secret.createdAt,
      });
    }
  }

  return decryptedSecrets;
}

/**
 * Validates release passphrase strength
 */
export function validateReleasePassphrase(passphrase: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (passphrase.length < 12) {
    errors.push('Passphrase must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a secure random release passphrase
 */
export function generateReleasePassphrase(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one character from each category
  let passphrase = '';
  passphrase += uppercase[Math.floor(Math.random() * uppercase.length)];
  passphrase += lowercase[Math.floor(Math.random() * lowercase.length)];
  passphrase += numbers[Math.floor(Math.random() * numbers.length)];
  passphrase += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining length with random characters
  for (let i = 4; i < 16; i++) {
    passphrase += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the passphrase
  return passphrase.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Creates a secure download package with client-side encryption
 */
export async function createSecureDownloadPackage(
  secrets: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    content: string;
    createdAt: string;
  }>,
  downloadPassword: string
): Promise<{
  encryptedData: string;
  salt: string;
  iv: string;
}> {
  // Create package data
  const packageData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalSecrets: secrets.length,
      categories: [...new Set(secrets.map(s => s.category).filter(Boolean))],
      version: '1.0',
    },
    secrets: secrets.map(secret => ({
      id: secret.id,
      title: secret.title,
      description: secret.description,
      category: secret.category,
      tags: secret.tags,
      content: secret.content,
      createdAt: secret.createdAt,
    })),
  };

  const dataString = JSON.stringify(packageData, null, 2);
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);

  // Generate salt and derive key
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordBuffer = encoder.encode(downloadPassword);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const key = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Generate IV and encrypt
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    'AES-GCM',
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    cryptoKey,
    data
  );

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}
