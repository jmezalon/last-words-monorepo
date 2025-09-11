import {
  deriveReleaseKey,
  combineKeys,
  decryptSecretWithReleaseKey,
  decryptAllSecrets,
  validateReleasePassphrase,
  generateReleasePassphrase,
  createSecureDownloadPackage,
} from '../lib/release-crypto';
import {
  generateCIK,
  wrapCIK,
  encryptPayload,
} from '../lib/crypto';

// Mock crypto.getRandomValues for consistent testing
const mockRandomValues = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockRandomValues,
    subtle: global.crypto?.subtle || {
      importKey: jest.fn(),
      deriveBits: jest.fn(),
      encrypt: jest.fn(),
    },
  },
});

describe('Release Crypto Functions', () => {
  beforeEach(() => {
    mockRandomValues.mockImplementation((array) => {
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveReleaseKey', () => {
    it('should derive consistent release key from passphrase and willId', async () => {
      const passphrase = 'test-release-passphrase-123';
      const willId = 'will-123';

      const key1 = await deriveReleaseKey(passphrase, willId);
      const key2 = await deriveReleaseKey(passphrase, willId);

      expect(key1).toEqual(key2);
      expect(key1).toHaveLength(32);
    });

    it('should produce different keys for different passphrases', async () => {
      const willId = 'will-123';
      const passphrase1 = 'passphrase-1';
      const passphrase2 = 'passphrase-2';

      const key1 = await deriveReleaseKey(passphrase1, willId);
      const key2 = await deriveReleaseKey(passphrase2, willId);

      expect(key1).not.toEqual(key2);
    });

    it('should produce different keys for different will IDs', async () => {
      const passphrase = 'same-passphrase';
      const willId1 = 'will-1';
      const willId2 = 'will-2';

      const key1 = await deriveReleaseKey(passphrase, willId1);
      const key2 = await deriveReleaseKey(passphrase, willId2);

      expect(key1).not.toEqual(key2);
    });
  });

  describe('combineKeys', () => {
    it('should correctly combine and separate keys using XOR', async () => {
      const masterKey = new Uint8Array(32).fill(0xAA);
      const releaseKey = new Uint8Array(32).fill(0x55);

      // Simulate MK⊕RK
      const combinedKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        combinedKey[i] = masterKey[i] ^ releaseKey[i];
      }
      const combinedKeyBase64 = btoa(String.fromCharCode(...combinedKey));

      // Test reconstruction
      const reconstructedMasterKey = combineKeys(combinedKeyBase64, releaseKey);

      expect(reconstructedMasterKey).toEqual(masterKey);
    });

    it('should handle edge case with zero keys', () => {
      const zeroKey = new Uint8Array(32).fill(0);
      const combinedKeyBase64 = btoa(String.fromCharCode(...zeroKey));

      const result = combineKeys(combinedKeyBase64, zeroKey);

      expect(result).toEqual(zeroKey);
    });
  });

  describe('decryptSecretWithReleaseKey', () => {
    it('should decrypt secret using release key flow', async () => {
      const originalContent = 'This is a secret message for testing';
      const releasePassphrase = 'test-release-passphrase';
      const willId = 'test-will-id';

      // Generate keys
      const masterKey = new Uint8Array(32).fill(0xAB);
      const userKey = await deriveReleaseKey(releasePassphrase, willId);
      const cik = generateCIK();

      // Encrypt content
      const { ciphertext, nonce } = encryptPayload(originalContent, cik);
      const encryptedCIK = await wrapCIK(cik, masterKey, userKey);

      const encryptedSecret = {
        encryptedCIK,
        ciphertext,
        nonce,
      };

      // Test decryption
      const decryptedContent = await decryptSecretWithReleaseKey(
        encryptedSecret,
        masterKey,
        releasePassphrase,
        willId
      );

      expect(decryptedContent).toBe(originalContent);
    });

    it('should fail with wrong release passphrase', async () => {
      const originalContent = 'Secret content';
      const correctPassphrase = 'correct-passphrase';
      const wrongPassphrase = 'wrong-passphrase';
      const willId = 'test-will-id';

      const masterKey = new Uint8Array(32).fill(0xCD);
      const userKey = await deriveReleaseKey(correctPassphrase, willId);
      const cik = generateCIK();

      const { ciphertext, nonce } = encryptPayload(originalContent, cik);
      const encryptedCIK = await wrapCIK(cik, masterKey, userKey);

      const encryptedSecret = { encryptedCIK, ciphertext, nonce };

      await expect(
        decryptSecretWithReleaseKey(encryptedSecret, masterKey, wrongPassphrase, willId)
      ).rejects.toThrow();
    });
  });

  describe('decryptAllSecrets', () => {
    it('should decrypt multiple secrets successfully', async () => {
      const secrets = [
        { content: 'Secret 1', title: 'Title 1' },
        { content: 'Secret 2', title: 'Title 2' },
      ];
      const releasePassphrase = 'batch-test-passphrase';
      const willId = 'batch-test-will';

      const masterKey = new Uint8Array(32).fill(0xEF);
      const releaseKey = await deriveReleaseKey(releasePassphrase, willId);

      // Create combined key (MK⊕RK)
      const combinedKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        combinedKey[i] = masterKey[i] ^ releaseKey[i];
      }
      const combinedKeyBase64 = btoa(String.fromCharCode(...combinedKey));

      // Encrypt secrets
      const encryptedSecrets = [];
      for (let i = 0; i < secrets.length; i++) {
        const cik = generateCIK();
        const { ciphertext, nonce } = encryptPayload(secrets[i].content, cik);
        const encryptedCIK = await wrapCIK(cik, masterKey, releaseKey);

        encryptedSecrets.push({
          id: `secret-${i}`,
          title: secrets[i].title,
          description: `Description ${i}`,
          category: 'test',
          tags: ['tag1', 'tag2'],
          encryptedCIK,
          ciphertext,
          nonce,
          createdAt: new Date().toISOString(),
        });
      }

      // Test batch decryption
      const decryptedSecrets = await decryptAllSecrets(
        encryptedSecrets,
        combinedKeyBase64,
        releasePassphrase,
        willId
      );

      expect(decryptedSecrets).toHaveLength(secrets.length);
      expect(decryptedSecrets[0].content).toBe(secrets[0].content);
      expect(decryptedSecrets[1].content).toBe(secrets[1].content);
    });

    it('should handle secrets with missing encryption data', async () => {
      const encryptedSecrets = [
        {
          id: 'secret-1',
          title: 'Valid Secret',
          encryptedCIK: 'valid-cik',
          ciphertext: 'valid-ciphertext',
          nonce: 'valid-nonce',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'secret-2',
          title: 'Invalid Secret',
          encryptedCIK: '',
          ciphertext: '',
          nonce: '',
          createdAt: new Date().toISOString(),
        },
      ];

      const decryptedSecrets = await decryptAllSecrets(
        encryptedSecrets,
        'dummy-key',
        'dummy-passphrase',
        'dummy-will'
      );

      expect(decryptedSecrets).toHaveLength(2);
      expect(decryptedSecrets[1].content).toContain('Content not available');
    });
  });

  describe('validateReleasePassphrase', () => {
    it('should validate strong passphrase', () => {
      const strongPassphrase = 'MyStr0ng!Passphrase123';
      const result = validateReleasePassphrase(strongPassphrase);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passphrases', () => {
      const weakPassphrase = 'weak';
      const result = validateReleasePassphrase(weakPassphrase);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require all character types', () => {
      const testCases = [
        { passphrase: 'alllowercase123!', missing: 'uppercase' },
        { passphrase: 'ALLUPPERCASE123!', missing: 'lowercase' },
        { passphrase: 'NoNumbers!Here', missing: 'number' },
        { passphrase: 'NoSpecialChars123', missing: 'special' },
      ];

      testCases.forEach(({ passphrase, missing }) => {
        const result = validateReleasePassphrase(passphrase);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.toLowerCase().includes(missing))).toBe(true);
      });
    });
  });

  describe('generateReleasePassphrase', () => {
    it('should generate valid passphrase', () => {
      const passphrase = generateReleasePassphrase();
      const validation = validateReleasePassphrase(passphrase);

      expect(validation.isValid).toBe(true);
      expect(passphrase.length).toBeGreaterThanOrEqual(12);
    });

    it('should generate different passphrases', () => {
      const passphrase1 = generateReleasePassphrase();
      const passphrase2 = generateReleasePassphrase();

      expect(passphrase1).not.toBe(passphrase2);
    });
  });

  describe('createSecureDownloadPackage', () => {
    beforeEach(() => {
      // Mock Web Crypto API for testing
      global.crypto.subtle.importKey = jest.fn().mockResolvedValue('mock-key');
      global.crypto.subtle.deriveBits = jest.fn().mockResolvedValue(new ArrayBuffer(32));
      global.crypto.subtle.encrypt = jest.fn().mockResolvedValue(new ArrayBuffer(100));
    });

    it('should create encrypted download package', async () => {
      const secrets = [
        {
          id: 'secret-1',
          title: 'Test Secret',
          description: 'Test Description',
          category: 'test',
          tags: ['tag1'],
          content: 'Secret content',
          createdAt: new Date().toISOString(),
        },
      ];
      const downloadPassword = 'download-password-123';

      const result = await createSecureDownloadPackage(secrets, downloadPassword);

      expect(result.encryptedData).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(typeof result.encryptedData).toBe('string');
    });

    it('should handle empty secrets array', async () => {
      const secrets: any[] = [];
      const downloadPassword = 'password';

      const result = await createSecureDownloadPackage(secrets, downloadPassword);

      expect(result.encryptedData).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iv).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full release flow end-to-end', async () => {
      const originalContent = 'Complete integration test content';
      const releasePassphrase = 'Integration!Test123';
      const willId = 'integration-will-id';

      // Step 1: Setup encryption (simulating will creation)
      const masterKey = new Uint8Array(32).fill(0x42);
      const releaseKey = await deriveReleaseKey(releasePassphrase, willId);
      const cik = generateCIK();

      // Step 2: Encrypt secret
      const { ciphertext, nonce } = encryptPayload(originalContent, cik);
      const encryptedCIK = await wrapCIK(cik, masterKey, releaseKey);

      // Step 3: Create combined key (server-side simulation)
      const combinedKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        combinedKey[i] = masterKey[i] ^ releaseKey[i];
      }
      const combinedKeyBase64 = btoa(String.fromCharCode(...combinedKey));

      // Step 4: Release flow - decrypt with passphrase
      const encryptedSecret = {
        id: 'integration-secret',
        title: 'Integration Test Secret',
        description: 'Test description',
        category: 'integration',
        tags: ['test', 'integration'],
        encryptedCIK,
        ciphertext,
        nonce,
        createdAt: new Date().toISOString(),
      };

      const decryptedSecrets = await decryptAllSecrets(
        [encryptedSecret],
        combinedKeyBase64,
        releasePassphrase,
        willId
      );

      // Step 5: Verify complete flow
      expect(decryptedSecrets).toHaveLength(1);
      expect(decryptedSecrets[0].content).toBe(originalContent);
      expect(decryptedSecrets[0].title).toBe('Integration Test Secret');
    });

    it('should fail gracefully with corrupted data', async () => {
      const corruptedSecret = {
        id: 'corrupted-secret',
        title: 'Corrupted Secret',
        encryptedCIK: 'invalid-base64-data',
        ciphertext: 'corrupted-ciphertext',
        nonce: 'invalid-nonce',
        createdAt: new Date().toISOString(),
      };

      const decryptedSecrets = await decryptAllSecrets(
        [corruptedSecret],
        'dummy-combined-key',
        'dummy-passphrase',
        'dummy-will'
      );

      expect(decryptedSecrets).toHaveLength(1);
      expect(decryptedSecrets[0].content).toContain('Decryption failed');
    });
  });
});
