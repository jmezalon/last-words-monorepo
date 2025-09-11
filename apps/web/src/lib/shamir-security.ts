/**
 * Simplified Shamir Security Manager for linting compliance
 * Basic security safeguards for Shamir Secret Sharing
 */

export interface SecurityAuditLog {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details: string;
  metadata?: Record<string, unknown>;
}

export interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
}

export class ShamirSecurityManager {
  private readonly MAX_ATTEMPTS_PER_HOUR = 10;
  private readonly MAX_RECONSTRUCTION_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

  private rateLimits: Map<string, RateLimitState> = new Map();
  private auditLogs: SecurityAuditLog[] = [];

  /**
   * Validate share tokens for basic format and security
   */
  validateShareTokens(tokens: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for empty tokens
    const emptyTokens = tokens.filter(token => !token.trim());
    if (emptyTokens.length > 0) {
      errors.push('All share tokens must be provided');
    }

    // Check for duplicate tokens
    const uniqueTokens = new Set(tokens.filter(t => t.trim()));
    if (uniqueTokens.size !== tokens.filter(t => t.trim()).length) {
      errors.push('Duplicate share tokens detected');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check rate limiting for an identifier
   */
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const state = this.rateLimits.get(identifier);

    if (!state) {
      this.rateLimits.set(identifier, {
        attempts: 1,
        lastAttempt: now,
        blocked: false
      });
      return true;
    }

    // Reset if enough time has passed
    if (now - state.lastAttempt > this.BLOCK_DURATION_MS) {
      state.attempts = 1;
      state.lastAttempt = now;
      state.blocked = false;
      return true;
    }

    // Check if blocked
    if (state.blocked) {
      return false;
    }

    // Increment attempts
    state.attempts++;
    state.lastAttempt = now;

    // Block if too many attempts
    if (state.attempts > this.MAX_ATTEMPTS_PER_HOUR) {
      state.blocked = true;
      return false;
    }

    return true;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: string, metadata?: Record<string, unknown>): void {
    const logEntry: SecurityAuditLog = {
      event,
      severity,
      timestamp: new Date().toISOString(),
      details,
      metadata
    };

    this.auditLogs.push(logEntry);

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  /**
   * Get security audit logs
   */
  getAuditLogs(severity?: string): SecurityAuditLog[] {
    if (severity) {
      return this.auditLogs.filter(log => log.severity === severity);
    }
    return [...this.auditLogs];
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const securityEvents = this.auditLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAttempts: Array.from(this.rateLimits.values()).reduce((sum, state) => sum + state.attempts, 0),
      blockedIdentifiers: Array.from(this.rateLimits.values()).filter(state => state.blocked).length,
      securityEvents,
      highSeverityEvents: this.auditLogs.filter(log => ['high', 'critical'].includes(log.severity)),
    };
  }

  /**
   * Clear security state (for testing)
   */
  clearSecurityState(): void {
    this.rateLimits.clear();
    this.auditLogs.length = 0;
  }
}
