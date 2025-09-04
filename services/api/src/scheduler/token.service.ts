import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

export interface AliveCheckTokenPayload {
  userId: string;
  checkId: string;
  type: 'alive-check';
  issuedAt: number;
  expiresAt: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  /**
   * Generate a signed token for alive check tracking
   */
  async generateAliveCheckToken(userId: string, expiresAt: Date): Promise<string> {
    const checkId = crypto.randomUUID();
    const now = Date.now();

    const payload: AliveCheckTokenPayload = {
      userId,
      checkId,
      type: 'alive-check',
      issuedAt: now,
      expiresAt: expiresAt.getTime(),
    };

    const token = jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: Math.floor((expiresAt.getTime() - now) / 1000), // seconds until expiry
    });

    this.logger.log(`Generated alive check token for user ${userId}, expires at ${expiresAt.toISOString()}`);
    return token;
  }

  /**
   * Verify and decode an alive check token
   */
  async verifyAliveCheckToken(token: string): Promise<AliveCheckTokenPayload | null> {
    try {
      const decoded = jwt.verify(token, this.secret) as AliveCheckTokenPayload;
      
      // Additional validation
      if (decoded.type !== 'alive-check') {
        this.logger.warn(`Invalid token type: ${decoded.type}`);
        return null;
      }

      if (decoded.expiresAt < Date.now()) {
        this.logger.warn(`Token expired for user ${decoded.userId}`);
        return null;
      }

      return decoded;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Generate a tracking token for email opens/clicks
   */
  async generateTrackingToken(userId: string, checkId: string, type: 'open' | 'click'): Promise<string> {
    const payload = {
      userId,
      checkId,
      type: `email-${type}`,
      timestamp: Date.now(),
    };

    return jwt.sign(payload, this.secret, {
      algorithm: 'HS256',
      expiresIn: '30d', // Tracking tokens valid for 30 days
    });
  }

  /**
   * Verify tracking token
   */
  async verifyTrackingToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      this.logger.error('Tracking token verification failed:', error);
      return null;
    }
  }

  /**
   * Generate a secure hash for idempotency keys
   */
  generateIdempotencyKey(userId: string, action: string, timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const data = `${userId}:${action}:${dateStr}`;
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create a signed URL for email confirmation
   */
  createConfirmationUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.APP_URL || 'http://localhost:3000';
    return `${base}/confirm-alive?token=${encodeURIComponent(token)}`;
  }

  /**
   * Create tracking pixel URL
   */
  createTrackingPixelUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || process.env.API_URL || 'http://localhost:3001';
    return `${base}/webhook/email-open?token=${encodeURIComponent(token)}`;
  }
}
