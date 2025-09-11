/**
 * Test suite for Shamir Security Manager and safeguards
 */

import { ShamirSecurityManager, ShamirSecurity } from '../shamir-security';
import { generateShamirShares, ShamirShare } from '../shamir';

describe('ShamirSecurityManager', () => {
  let securityManager: ShamirSecurityManager;
  const testWillId = 'test-will-123';
  const testBeneficiaryIds = ['ben-1', 'ben-2', 'ben-3'];

  beforeEach(() => {
    securityManager = ShamirSecurityManager.getInstance();
    // Clear any existing state
    (securityManager as any).rateLimits.clear();
    (securityManager as any).auditLogs = [];
  });

  describe('validateShareTokens', () => {
    it('should validate correct tokens', () => {
      const validTokens = [
        'eyJ0ZXN0IjoidmFsaWQifQ==', // Valid base64 JSON
        'eyJhbm90aGVyIjoidGVzdCJ9', // Valid base64 JSON
      ];

      const result = securityManager.validateShareTokens(validTokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty tokens', () => {
      const tokens = ['valid-token', '', 'another-token'];
      const result = securityManager.validateShareTokens(tokens);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('All share tokens must be provided');
    });

    it('should detect duplicate tokens', () => {
      const tokens = ['token1', 'token1', 'token2'];
      const result = securityManager.validateShareTokens(tokens);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate share tokens detected');
    });

    it('should reject oversized tokens', () => {
      const oversizedToken = 'a'.repeat(3000);
      const tokens = ['valid-token', oversizedToken];
      const result = securityManager.validateShareTokens(tokens);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Token length exceeds maximum allowed size');
    });

    it('should reject invalid token formats', () => {
      const tokens = ['invalid-base64!@#', 'another-invalid'];
      const result = securityManager.validateShareTokens(tokens);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid token format detected');
    });
  });

  describe('checkRateLimit', () => {
    const identifier = 'test-user-123';

    it('should allow initial attempts', () => {
      const result = securityManager.checkRateLimit(identifier);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10); // MAX_ATTEMPTS_PER_HOUR
    });

    it('should track attempts and reduce remaining count', () => {
      // Make several attempts
      for (let i = 0; i < 5; i++) {
        securityManager.recordAttempt(identifier, false);
      }

      const result = securityManager.checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // 10 - 5
    });

    it('should block after exceeding rate limit', () => {
      // Exceed the rate limit
      for (let i = 0; i < 11; i++) {
        securityManager.recordAttempt(identifier, false);
      }

      const result = securityManager.checkRateLimit(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeDefined();
    });

    it('should reset after time window', () => {
      // Simulate time passing by manipulating the internal state
      securityManager.recordAttempt(identifier, false);
      const rateLimits = (securityManager as any).rateLimits;
      const state = rateLimits.get(identifier);
      state.lastAttempt = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago

      const result = securityManager.checkRateLimit(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });
  });

  describe('validateShareConsistency', () => {
    let testShares: (ShamirShare & { shareData: number[] })[];

    beforeEach(async () => {
      const testReleaseKey = new Uint8Array(32);
      crypto.getRandomValues(testReleaseKey);
      const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
      testShares = shareSet.shares as any;
    });

    it('should validate consistent shares', () => {
      const shares = testShares.slice(0, 2);
      const result = securityManager.validateShareConsistency(shares);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty share array', () => {
      const result = securityManager.validateShareConsistency([]);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No shares provided');
    });

    it('should reject shares from different wills', () => {
      const shares = [
        testShares[0],
        { ...testShares[1], willId: 'different-will' }
      ];
      
      const result = securityManager.validateShareConsistency(shares);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shares must be from the same will');
    });

    it('should detect duplicate share indices', () => {
      const shares = [
        testShares[0],
        { ...testShares[1], shareIndex: testShares[0].shareIndex }
      ];
      
      const result = securityManager.validateShareConsistency(shares);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate share indices detected');
    });

    it('should detect manipulated share data', () => {
      const shares = [
        testShares[0],
        { ...testShares[1], shareData: new Array(32).fill(0) } // All zeros
      ];
      
      const result = securityManager.validateShareConsistency(shares);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Potentially manipulated share data detected');
    });

    it('should detect temporal inconsistencies', () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
      const shares = [
        testShares[0],
        { ...testShares[1], createdAt: oldDate }
      ];
      
      const result = securityManager.validateShareConsistency(shares);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shares created too far apart in time');
    });
  });

  describe('detectBruteForce', () => {
    const identifier = 'test-attacker';

    it('should detect brute force attempts', () => {
      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        securityManager.recordAttempt(identifier, false);
      }

      const isBruteForce = securityManager.detectBruteForce(identifier, []);
      expect(isBruteForce).toBe(true);
    });

    it('should not flag normal usage', () => {
      securityManager.recordAttempt(identifier, true);
      
      const isBruteForce = securityManager.detectBruteForce(identifier, []);
      expect(isBruteForce).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = securityManager.sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
    });

    it('should remove dangerous protocols', () => {
      const inputs = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)'
      ];

      inputs.forEach(input => {
        const sanitized = securityManager.sanitizeInput(input);
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('data:');
        expect(sanitized).not.toContain('vbscript:');
      });
    });
  });

  describe('audit logging', () => {
    it('should log security events', () => {
      securityManager.validateShareTokens(['duplicate', 'duplicate']);
      
      const logs = securityManager.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const duplicateLog = logs.find(log => log.event === 'duplicate_tokens');
      expect(duplicateLog).toBeDefined();
      expect(duplicateLog?.severity).toBe('medium');
    });

    it('should filter logs by severity', () => {
      // Generate events of different severities
      securityManager.validateShareTokens(['duplicate', 'duplicate']); // medium
      securityManager.detectBruteForce('attacker', []); // May generate critical
      
      const highSeverityLogs = securityManager.getAuditLogs('high');
      const mediumSeverityLogs = securityManager.getAuditLogs('medium');
      
      expect(mediumSeverityLogs.length).toBeGreaterThan(0);
      expect(highSeverityLogs.every(log => log.severity === 'high')).toBe(true);
    });

    it('should cleanup old logs', () => {
      // Add many logs
      for (let i = 0; i < 1100; i++) {
        (securityManager as any).logSecurityEvent(`test-event-${i}`, 'low', 'Test');
      }

      securityManager.cleanupAuditLogs();
      
      const logs = securityManager.getAuditLogs();
      expect(logs.length).toBe(1000);
    });
  });

  describe('generateSecurityReport', () => {
    it('should generate comprehensive security report', () => {
      // Generate some activity
      securityManager.recordAttempt('user1', false);
      securityManager.recordAttempt('user2', true);
      securityManager.validateShareTokens(['duplicate', 'duplicate']);
      
      const report = securityManager.generateSecurityReport();
      
      expect(report.totalAttempts).toBeGreaterThan(0);
      expect(report.securityEvents).toBeDefined();
      expect(typeof report.securityEvents).toBe('object');
      expect(report.highSeverityEvents).toBeDefined();
      expect(Array.isArray(report.highSeverityEvents)).toBe(true);
    });
  });
});

describe('ShamirSecurity utilities', () => {
  describe('generateIdentifier', () => {
    it('should generate unique identifiers', () => {
      const id1 = ShamirSecurity.generateIdentifier('will-1');
      const id2 = ShamirSecurity.generateIdentifier('will-1');
      
      expect(id1).not.toBe(id2);
      expect(id1).toContain('will-1');
      expect(id2).toContain('will-1');
    });

    it('should include user agent hash when provided', () => {
      const userAgent = 'Mozilla/5.0 (Test Browser)';
      const id = ShamirSecurity.generateIdentifier('will-1', userAgent);
      
      expect(id).toContain('will-1');
      expect(id.split('_')).toHaveLength(3); // willId_timestamp_hash
    });
  });

  describe('validateEnvironment', () => {
    it('should validate browser environment', () => {
      const result = ShamirSecurity.validateEnvironment();
      
      expect(result).toHaveProperty('secure');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('secureCleanup', () => {
    it('should zero out Uint8Array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      ShamirSecurity.secureCleanup(data);
      
      expect(Array.from(data)).toEqual([0, 0, 0, 0, 0]);
    });

    it('should zero out regular arrays', () => {
      const data = [1, 2, 3, 4, 5];
      ShamirSecurity.secureCleanup(data);
      
      expect(data).toEqual([0, 0, 0, 0, 0]);
    });
  });
});

describe('Integration with Shamir implementation', () => {
  let securityManager: ShamirSecurityManager;
  const testWillId = 'integration-test-will';
  const testBeneficiaryIds = ['ben-1', 'ben-2', 'ben-3'];

  beforeEach(() => {
    securityManager = ShamirSecurityManager.getInstance();
    (securityManager as any).rateLimits.clear();
    (securityManager as any).auditLogs = [];
  });

  it('should integrate security checks with share combination', async () => {
    const testReleaseKey = new Uint8Array(32);
    crypto.getRandomValues(testReleaseKey);
    
    // Generate shares
    const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    const shares = shareSet.shares.slice(0, 2) as any;
    
    // Validate with security manager
    const validation = securityManager.validateShareConsistency(shares);
    expect(validation.valid).toBe(true);
    
    // Check rate limiting
    const identifier = ShamirSecurity.generateIdentifier(testWillId);
    const rateCheck = securityManager.checkRateLimit(identifier);
    expect(rateCheck.allowed).toBe(true);
    
    // Record successful attempt
    securityManager.recordAttempt(identifier, true);
    
    // Verify audit log
    const logs = securityManager.getAuditLogs();
    const successLog = logs.find(log => log.event === 'reconstruction_success');
    expect(successLog).toBeDefined();
  });

  it('should handle security violations during reconstruction', async () => {
    const testReleaseKey = new Uint8Array(32);
    crypto.getRandomValues(testReleaseKey);
    
    const shareSet = await generateShamirShares(testReleaseKey, testWillId, testBeneficiaryIds);
    
    // Create malicious shares (different will IDs)
    const maliciousShares = [
      shareSet.shares[0],
      { ...shareSet.shares[1], willId: 'malicious-will' }
    ] as any;
    
    // Security validation should catch this
    const validation = securityManager.validateShareConsistency(maliciousShares);
    expect(validation.valid).toBe(false);
    
    // Should log security event
    const logs = securityManager.getAuditLogs();
    const securityLog = logs.find(log => log.event === 'mixed_will_shares');
    expect(securityLog).toBeDefined();
    expect(securityLog?.severity).toBe('high');
  });
});
