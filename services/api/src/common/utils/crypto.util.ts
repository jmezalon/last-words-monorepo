import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export class CryptoUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly HMAC_ALGORITHM = 'sha256';

  /**
   * Generate a salted HMAC for email addresses
   * Used for privacy-preserving email lookups
   */
  static generateEmailHmac(
    email: string,
    salt?: string
  ): { hmac: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(32).toString('hex');
    const hmac = crypto
      .createHmac(this.HMAC_ALGORITHM, actualSalt)
      .update(email.toLowerCase().trim())
      .digest('hex');

    return { hmac, salt: actualSalt };
  }

  /**
   * Verify email against HMAC
   */
  static verifyEmailHmac(email: string, hmac: string, salt: string): boolean {
    const { hmac: computedHmac } = this.generateEmailHmac(email, salt);
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(computedHmac));
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate cryptographically secure random salt
   */
  static generateSalt(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
