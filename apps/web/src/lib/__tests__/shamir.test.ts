/**
 * Comprehensive test suite for Shamir Secret Sharing implementation
 */

import {
  generateShamirShares,
  combineShamirShares,
  validateShareCombination,
  verifyShamirReconstruction,
  encodeShamirShare,
  decodeShamirShare,
  generateShareDistributionTokens,
} from '../shamir';

describe('Shamir Secret Sharing', () => {
  const testReleaseKey = new Uint8Array(32);
  crypto.getRandomValues(testReleaseKey);
  
  const testWillId = 'test-will-123';
  const testBeneficiaryIds = ['ben-1', 'ben-2', 'ben-3'];

  describe('generateShamirShares', () => {
    it('should generate 3 shares for 2-of-3 scheme', async () => {
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      
      expect(shareSet.threshold).toBe(2);
      expect(shareSet.totalShares).toBe(3);
      expect(shareSet.shares).toHaveLength(3);
      expect(shareSet.willId).toBe(testWillId);
      expect(shareSet.releaseKeyHash).toBeDefined();
    });

    it('should require exactly 3 beneficiaries', async () => {
      await expect(
        generateShamirShares(testReleaseKey, testWillId, ['ben-1', 'ben-2'])
      ).rejects.toThrow('Exactly 3 beneficiaries required');
    });

    it('should require 32-byte release key', async () => {
      const shortKey = new Uint8Array(16);
      await expect(
        generateShamirShares(shortKey, testWillId, testBeneficiaryIds)
      ).rejects.toThrow('Release key must be 32 bytes');
    });

    it('should generate unique shares with correct indices', async () => {
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      
      const shareIndices = shareSet.shares.map(s => s.shareIndex);
      expect(shareIndices.sort()).toEqual([1, 2, 3]);
      
      const shareIds = shareSet.shares.map(s => s.id);
      expect(new Set(shareIds).size).toBe(3); // All unique
    });
  });

  describe('combineShamirShares', () => {
    let shareSet: any;

    beforeEach(async () => {
      shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    });

    it('should reconstruct original key with 2 shares', () => {
      const shares = shareSet.shares.slice(0, 2);
      const reconstructed = combineShamirShares(shares);
      
      expect(reconstructed).toEqual(testReleaseKey);
    });

    it('should reconstruct original key with all 3 shares', () => {
      const reconstructed = combineShamirShares(shareSet.shares);
      
      expect(reconstructed).toEqual(testReleaseKey);
    });

    it('should work with different combinations of 2 shares', () => {
      const combinations = [
        [0, 1], [0, 2], [1, 2]
      ];

      combinations.forEach(([i, j]) => {
        const shares = [shareSet.shares[i], shareSet.shares[j]];
        const reconstructed = combineShamirShares(shares);
        expect(reconstructed).toEqual(testReleaseKey);
      });
    });

    it('should require at least 2 shares', () => {
      expect(() => combineShamirShares([shareSet.shares[0]]))
        .toThrow('At least 2 shares required');
    });

    it('should reject shares from different wills', () => {
      const shares = [
        shareSet.shares[0],
        { ...shareSet.shares[1], willId: 'different-will' }
      ];
      
      expect(() => combineShamirShares(shares))
        .toThrow('All shares must be for the same will');
    });
  });

  describe('validateShareCombination', () => {
    let shareSet: any;

    beforeEach(async () => {
      shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    });

    it('should validate correct share combination', () => {
      const shares = shareSet.shares.slice(0, 2);
      const validation = validateShareCombination(shares);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject insufficient shares', () => {
      const validation = validateShareCombination([shareSet.shares[0]]);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('At least 2 shares required for reconstruction');
    });

    it('should reject duplicate shares', () => {
      const shares = [shareSet.shares[0], shareSet.shares[0]];
      const validation = validateShareCombination(shares);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Duplicate shares detected');
    });

    it('should reject mixed will shares', () => {
      const shares = [
        shareSet.shares[0],
        { ...shareSet.shares[1], willId: 'different-will' }
      ];
      const validation = validateShareCombination(shares);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('All shares must be for the same will');
    });
  });

  describe('verifyShamirReconstruction', () => {
    let shareSet: any;

    beforeEach(async () => {
      shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    });

    it('should verify correct reconstruction', async () => {
      const shares = shareSet.shares.slice(0, 2);
      const reconstructed = combineShamirShares(shares);
      
      const isValid = await verifyShamirReconstruction(reconstructed, shareSet.releaseKeyHash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect reconstruction', async () => {
      const wrongKey = new Uint8Array(32);
      crypto.getRandomValues(wrongKey);
      
      const isValid = await verifyShamirReconstruction(wrongKey, shareSet.releaseKeyHash);
      expect(isValid).toBe(false);
    });
  });

  describe('encodeShamirShare and decodeShamirShare', () => {
    let shareSet: any;

    beforeEach(async () => {
      shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    });

    it('should encode and decode shares correctly', () => {
      const originalShare = shareSet.shares[0];
      const encoded = encodeShamirShare(originalShare);
      const decoded = decodeShamirShare(encoded);
      
      expect(decoded.id).toBe(originalShare.id);
      expect(decoded.willId).toBe(originalShare.willId);
      expect(decoded.beneficiaryId).toBe(originalShare.beneficiaryId);
      expect(decoded.shareIndex).toBe(originalShare.shareIndex);
      expect(decoded.shareData).toEqual(originalShare.shareData);
    });

    it('should reject invalid encoded shares', () => {
      expect(() => decodeShamirShare('invalid-encoding'))
        .toThrow('Invalid share encoding format');
    });

    it('should handle base64 encoding correctly', () => {
      const share = shareSet.shares[0];
      const encoded = encodeShamirShare(share);
      
      // Should be valid base64
      expect(() => atob(encoded)).not.toThrow();
      
      // Should decode to valid JSON
      const decodedJson = JSON.parse(atob(encoded));
      expect(decodedJson.willId).toBe(share.willId);
    });
  });

  describe('generateShareDistributionTokens', () => {
    let shareSet: any;
    const testEmails = ['ben1@example.com', 'ben2@example.com', 'ben3@example.com'];

    beforeEach(async () => {
      shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    });

    it('should generate distribution tokens for all beneficiaries', async () => {
      const tokens = await generateShareDistributionTokens(shareSet, testEmails);
      
      expect(tokens).toHaveLength(3);
      tokens.forEach((token, index) => {
        expect(token.beneficiaryId).toBe(testBeneficiaryIds[index]);
        expect(token.email).toBe(testEmails[index]);
        expect(token.shareIndex).toBe(index + 1);
        expect(token.token).toBeDefined();
      });
    });

    it('should require exactly 3 emails', async () => {
      await expect(
        generateShareDistributionTokens(shareSet, ['email1@example.com'])
      ).rejects.toThrow('Exactly 3 beneficiary emails required');
    });

    it('should generate unique tokens', async () => {
      const tokens = await generateShareDistributionTokens(shareSet, testEmails);
      const tokenValues = tokens.map(t => t.token);
      
      expect(new Set(tokenValues).size).toBe(3);
    });
  });

  describe('End-to-end workflow', () => {
    it('should complete full share generation and reconstruction cycle', async () => {
      // 1. Generate shares
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      
      // 2. Encode shares for distribution
      const encodedShares = shareSet.shares.map(share => encodeShamirShare(share));
      
      // 3. Simulate beneficiaries receiving and decoding shares
      const decodedShares = encodedShares.map(encoded => decodeShamirShare(encoded));
      
      // 4. Combine any 2 shares
      const selectedShares = decodedShares.slice(0, 2);
      const reconstructed = combineShamirShares(selectedShares);
      
      // 5. Verify reconstruction
      const isValid = await verifyShamirReconstruction(reconstructed, shareSet.releaseKeyHash);
      
      expect(isValid).toBe(true);
      expect(reconstructed).toEqual(testReleaseKey);
    });

    it('should handle multiple reconstruction attempts', async () => {
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      
      // Try all possible 2-share combinations
      const combinations = [[0, 1], [0, 2], [1, 2]];
      
      for (const [i, j] of combinations) {
        const shares = [shareSet.shares[i], shareSet.shares[j]];
        const reconstructed = combineShamirShares(shares);
        const isValid = await verifyShamirReconstruction(reconstructed, shareSet.releaseKeyHash);
        
        expect(isValid).toBe(true);
        expect(reconstructed).toEqual(testReleaseKey);
      }
    });
  });

  describe('Security and edge cases', () => {
    it('should handle corrupted share data gracefully', async () => {
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      
      // Corrupt one share
      const corruptedShares = [...shareSet.shares];
      corruptedShares[0].shareData[0] = 255; // Change first byte
      
      const shares = corruptedShares.slice(0, 2);
      const reconstructed = combineShamirShares(shares);
      
      // Should not match original key
      expect(reconstructed).not.toEqual(testReleaseKey);
      
      // Verification should fail
      const isValid = await verifyShamirReconstruction(reconstructed, shareSet.releaseKeyHash);
      expect(isValid).toBe(false);
    });

    it('should generate different shares for different keys', async () => {
      const key1 = new Uint8Array(32);
      const key2 = new Uint8Array(32);
      crypto.getRandomValues(key1);
      crypto.getRandomValues(key2);
      
      const shareSet1 = await generateShamirShares(key1, testWillId, testBeneficiaryIds);
      const shareSet2 = await generateShamirShares(key2, testWillId, testBeneficiaryIds);
      
      // Shares should be different
      expect(shareSet1.shares[0].shareData).not.toEqual(shareSet2.shares[0].shareData);
      expect(shareSet1.releaseKeyHash).not.toBe(shareSet2.releaseKeyHash);
    });

    it('should maintain consistency across multiple generations', async () => {
      // Generate the same key multiple times
      const results = await Promise.all([
        generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds),
        generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds),
        generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds),
      ]);
      
      // All should have the same hash (deterministic from key)
      const hashes = results.map(r => r.releaseKeyHash);
      expect(new Set(hashes).size).toBe(1);
      
      // But shares should be different (random coefficients)
      const firstShareData = results.map(r => r.shares[0].shareData);
      expect(new Set(firstShareData.map(d => d.join(','))).size).toBe(3);
    });
  });
});
