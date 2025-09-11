/**
 * Security Headers Middleware
 * Implements comprehensive security headers for the API service
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy for API endpoints
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    );

    // HTTP Strict Transport Security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Cross-Origin Embedder Policy
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin Opener Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin Resource Policy
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-DNS-Prefetch-Control
    res.setHeader('X-DNS-Prefetch-Control', 'off');

    // X-Download-Options
    res.setHeader('X-Download-Options', 'noopen');

    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Cache-Control for sensitive API responses
    if (
      req.path.includes('/auth') ||
      req.path.includes('/crypto') ||
      req.path.includes('/shamir')
    ) {
      res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Server header removal (handled by reverse proxy in production)
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Rate limiting headers (will be set by rate limiting middleware)
    if (!res.getHeader('X-RateLimit-Limit')) {
      res.setHeader('X-RateLimit-Limit', '100');
      res.setHeader('X-RateLimit-Remaining', '99');
      res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 3600);
    }

    next();
  }
}
