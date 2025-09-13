import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';
import { AuditChainService } from '../audit/audit-chain.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly customLogger: CustomLoggerService,
    private readonly auditChain: AuditChainService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    
    // Generate request ID if not present
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = uuidv4();
    }
    
    const requestId = request.headers['x-request-id'] as string;
    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip || request.connection.remoteAddress;
    
    // Extract user context from JWT or session
    const userId = (request as any).user?.id;
    const sessionId = (request as any).session?.id;

    const logContext = {
      requestId,
      userId,
      sessionId,
      operation: `${method} ${url}`,
      metadata: {
        method,
        url,
        userAgent,
        ipAddress
      }
    };

    // Log request start
    this.customLogger.log(`Incoming ${method} ${url}`, logContext);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful request completion
        this.customLogger.logRequest(request, response, duration);

        // Log performance metrics
        this.customLogger.logPerformanceMetric(
          'request_duration',
          duration,
          'ms',
          logContext
        );

        // Audit sensitive operations
        if (this.isSensitiveOperation(url, method)) {
          this.auditChain.appendAuditEntry({
            timestamp: new Date(),
            userId,
            sessionId,
            operation: this.getOperationType(url, method),
            resource: this.getResourceType(url),
            action: this.getActionType(method, url),
            result: statusCode < 400 ? 'success' : 'failure',
            details: {
              statusCode,
              duration,
              endpoint: `${method} ${url}`
            },
            ipAddress,
            userAgent,
            duration
          });
        }

        // Log business events for key operations
        if (this.isBusinessEvent(url, method)) {
          this.customLogger.logBusinessEvent(
            this.getBusinessEventType(url, method),
            { statusCode, duration },
            logContext
          );
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        // Log error with full context
        this.customLogger.logError(error, {
          ...logContext,
          operation: `${method} ${url}`,
          userId
        });

        // Audit failed operations
        if (this.isSensitiveOperation(url, method)) {
          this.auditChain.appendAuditEntry({
            timestamp: new Date(),
            userId,
            sessionId,
            operation: this.getOperationType(url, method),
            resource: this.getResourceType(url),
            action: this.getActionType(method, url),
            result: 'error',
            details: {
              statusCode,
              duration,
              endpoint: `${method} ${url}`,
              errorName: error.name,
              errorMessage: error.message
            },
            ipAddress,
            userAgent,
            duration,
            errorCode: error.code || 'UNKNOWN_ERROR',
            errorMessage: error.message
          });
        }

        // Log security events for suspicious activity
        if (this.isSecurityEvent(error, url, method)) {
          this.customLogger.logSecurityEvent(
            `Failed ${method} ${url}: ${error.message}`,
            this.getSecuritySeverity(error, url),
            logContext
          );
        }

        throw error;
      })
    );
  }

  private isSensitiveOperation(url: string, method: string): boolean {
    const sensitivePatterns = [
      '/auth/',
      '/crypto/',
      '/shamir/',
      '/release/',
      '/users/',
      '/wills/'
    ];

    return sensitivePatterns.some(pattern => url.includes(pattern));
  }

  private getOperationType(url: string, method: string): string {
    if (url.includes('/auth/')) return 'authentication';
    if (url.includes('/crypto/')) return 'cryptography';
    if (url.includes('/shamir/')) return 'shamir_secret_sharing';
    if (url.includes('/release/')) return 'release_event';
    if (url.includes('/users/')) return 'user_management';
    if (url.includes('/wills/')) return 'will_management';
    return 'general';
  }

  private getResourceType(url: string): string {
    if (url.includes('/auth/')) return 'user_session';
    if (url.includes('/crypto/')) return 'crypto_service';
    if (url.includes('/shamir/')) return 'shamir_shares';
    if (url.includes('/release/')) return 'release_package';
    if (url.includes('/users/')) return 'user_profile';
    if (url.includes('/wills/')) return 'will_document';
    return 'unknown';
  }

  private getActionType(method: string, url: string): string {
    const action = method.toLowerCase();
    
    if (url.includes('/login')) return 'login';
    if (url.includes('/logout')) return 'logout';
    if (url.includes('/register')) return 'register';
    if (url.includes('/generate')) return 'generate';
    if (url.includes('/encrypt')) return 'encrypt';
    if (url.includes('/decrypt')) return 'decrypt';
    if (url.includes('/distribute')) return 'distribute';
    if (url.includes('/combine')) return 'combine';
    if (url.includes('/access')) return 'access';
    if (url.includes('/download')) return 'download';
    
    return action;
  }

  private isBusinessEvent(url: string, method: string): boolean {
    const businessPatterns = [
      '/wills/create',
      '/wills/update',
      '/shamir/distribute',
      '/release/access',
      '/crypto/generate',
      '/users/register'
    ];

    return businessPatterns.some(pattern => url.includes(pattern));
  }

  private getBusinessEventType(url: string, method: string): string {
    if (url.includes('/wills/create')) return 'will_created';
    if (url.includes('/wills/update')) return 'will_updated';
    if (url.includes('/shamir/distribute')) return 'shares_distributed';
    if (url.includes('/release/access')) return 'release_accessed';
    if (url.includes('/crypto/generate')) return 'key_generated';
    if (url.includes('/users/register')) return 'user_registered';
    return 'unknown_business_event';
  }

  private isSecurityEvent(error: any, url: string, method: string): boolean {
    // Check for common security-related errors
    const securityErrorPatterns = [
      'unauthorized',
      'forbidden',
      'invalid token',
      'authentication failed',
      'rate limit',
      'suspicious activity'
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return securityErrorPatterns.some(pattern => errorMessage.includes(pattern)) ||
           error.status === 401 ||
           error.status === 403 ||
           error.status === 429;
  }

  private getSecuritySeverity(error: any, url: string): 'low' | 'medium' | 'high' | 'critical' {
    if (error.status === 401 && url.includes('/auth/')) return 'medium';
    if (error.status === 403) return 'high';
    if (error.status === 429) return 'medium';
    if (url.includes('/crypto/') || url.includes('/shamir/') || url.includes('/release/')) return 'high';
    return 'low';
  }
}
