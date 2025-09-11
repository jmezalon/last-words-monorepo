/**
 * CORS Middleware with Security Controls
 * Implements strict CORS policy for the API service
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.PRODUCTION_URL || 'https://lastwords.app',
    // Add your production domains here
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin && process.env.NODE_ENV === 'development') {
      // Allow same-origin requests in development
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // Allowed methods
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );

    // Allowed headers
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key, X-Client-Version'
    );

    // Allow credentials
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Preflight cache duration
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}
