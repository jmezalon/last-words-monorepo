/**
 * @jest-environment jsdom
 */

import { generateSalt, generateCIK, encryptPayload, decryptPayload } from '../lib/crypto';

// Mock crypto.getRandomValues for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn((arr: Uint8Array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i % 256;
      }
      return arr;
    }),
  },
});

describe('Crypto Functions', () => {
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
