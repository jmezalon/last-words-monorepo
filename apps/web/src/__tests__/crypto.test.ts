/**
 * @jest-environment jsdom
 */

import { 
  deriveUserKey, 
  generateCIK, 
  wrapCIK, 
  unwrapCIK, 
  encryptPayload, 
  decryptPayload,
  generateSalt
} from '../lib/crypto';

// Mock crypto.getRandomValues for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint8Array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
      }
    }),
  },
});

describe('Crypto Functions', () => {
  const testPassword = 'test-password-123';
  const testSalt = 'abcdef1234567890abcdef1234567890';
  const testPayload = JSON.stringify({
    title: 'Test Secret',
    description: 'Test Description',
    content: 'Secret content here',
    category: 'Personal',
    tags: ['test', 'crypto']
  });

  test('deriveUserKey produces consistent results', async () => {
    const userKey1 = await deriveUserKey(testPassword, testSalt);
    const userKey2 = await deriveUserKey(testPassword, testSalt);
    
    expect(userKey1).toEqual(userKey2);
    expect(userKey1.length).toBe(32);
  });

  test('generateCIK produces random keys', () => {
    const cik1 = generateCIK();
    const cik2 = generateCIK();
    
    expect(cik1).not.toEqual(cik2);
    expect(cik1.length).toBe(32);
    expect(cik2.length).toBe(32);
  });

  test('CIK wrapping and unwrapping round-trip', async () => {
    const userKey = await deriveUserKey(testPassword, testSalt);
    const masterKey = new Uint8Array(32).fill(42); // Test master key
    const originalCIK = generateCIK();
    
    // Wrap the CIK
    const encryptedCIK = await wrapCIK(originalCIK, masterKey, userKey);
    expect(typeof encryptedCIK).toBe('string');
    
    // Unwrap the CIK
    const unwrappedCIK = await unwrapCIK(encryptedCIK, masterKey, userKey);
    expect(unwrappedCIK).toEqual(originalCIK);
  });

  test('payload encryption and decryption round-trip', async () => {
    const cik = generateCIK();
    
    // Encrypt payload
    const { ciphertext, nonce } = await encryptPayload(testPayload, cik);
    expect(typeof ciphertext).toBe('string');
    expect(typeof nonce).toBe('string');
    
    // Decrypt payload
    const decryptedPayload = await decryptPayload(ciphertext, nonce, cik);
    expect(decryptedPayload).toBe(testPayload);
  });

  test('full encryption workflow round-trip', async () => {
    // Simulate full encryption workflow
    const userKey = await deriveUserKey(testPassword, testSalt);
    const masterKey = new Uint8Array(32).fill(123); // Test master key
    const cik = generateCIK();
    
    // Wrap CIK
    const encryptedCIK = await wrapCIK(cik, masterKey, userKey);
    
    // Encrypt payload
    const { ciphertext, nonce } = await encryptPayload(testPayload, cik);
    
    // Simulate storage and retrieval
    // Unwrap CIK
    const unwrappedCIK = await unwrapCIK(encryptedCIK, masterKey, userKey);
    
    // Decrypt payload
    const decryptedPayload = await decryptPayload(ciphertext, nonce, unwrappedCIK);
    
    expect(decryptedPayload).toBe(testPayload);
  });

  test('different passwords produce different keys', async () => {
    const userKey1 = await deriveUserKey('password1', testSalt);
    const userKey2 = await deriveUserKey('password2', testSalt);
    
    expect(userKey1).not.toEqual(userKey2);
  });

  test('different salts produce different keys', async () => {
    const salt1 = 'salt1111111111111111111111111111';
    const salt2 = 'salt2222222222222222222222222222';
    
    const userKey1 = await deriveUserKey(testPassword, salt1);
    const userKey2 = await deriveUserKey(testPassword, salt2);
    
    expect(userKey1).not.toEqual(userKey2);
  });

  test('generateSalt creates a base64 string', () => {
    const salt = generateSalt();
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThan(0);
    
    // Should be valid base64
    expect(() => atob(salt)).not.toThrow();
  });

  test('generateCIK creates a 32-byte key', () => {
    const cik = generateCIK();
    expect(cik).toBeInstanceOf(Uint8Array);
    expect(cik.length).toBe(32);
  });

  test('encrypt/decrypt round-trip works', () => {
    const originalText = 'This is a secret message that should be encrypted and decrypted correctly';
    const cik = generateCIK();
    
    // Encrypt the text
    const { ciphertext, nonce } = encryptPayload(originalText, cik);
    
    expect(typeof ciphertext).toBe('string');
    expect(typeof nonce).toBe('string');
    expect(ciphertext).not.toBe(originalText);
    
    // Decrypt the text
    const decryptedText = decryptPayload(ciphertext, nonce, cik);
    
    expect(decryptedText).toBe(originalText);
  });

  test('different CIKs produce different ciphertexts', () => {
    const originalText = 'Same message';
    const cik1 = generateCIK();
    const cik2 = generateCIK();
    
    const result1 = encryptPayload(originalText, cik1);
    const result2 = encryptPayload(originalText, cik2);
    
    // Different CIKs should produce different ciphertexts
    expect(result1.ciphertext).not.toBe(result2.ciphertext);
    
    // But both should decrypt to the same original text
    expect(decryptPayload(result1.ciphertext, result1.nonce, cik1)).toBe(originalText);
    expect(decryptPayload(result2.ciphertext, result2.nonce, cik2)).toBe(originalText);
  });

  test('wrong CIK fails to decrypt', () => {
    const originalText = 'Secret message';
    const correctCik = generateCIK();
    const wrongCik = generateCIK();
    
    const { ciphertext, nonce } = encryptPayload(originalText, correctCik);
    
    // Should throw when using wrong CIK
    expect(() => {
      decryptPayload(ciphertext, nonce, wrongCik);
    }).toThrow();
  });
});
