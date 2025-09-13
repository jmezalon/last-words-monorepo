import { Injectable, LoggerService } from '@nestjs/common';
import pino, { Logger } from 'pino';
import { ConfigService } from '@nestjs/config';

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation?: string;
  resource?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  timestamp: string;
  level: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  operation: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'error';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: Logger;
  private readonly auditLogger: Logger;

  constructor(private configService: ConfigService) {
    // Main application logger with redaction
    this.logger = pino({
      level: this.configService.get('LOG_LEVEL', 'info'),
      redact: {
        paths: [
          'password',
          'token',
          'secret',
          'key',
          'authorization',
          'cookie',
          'passphrase',
          'privateKey',
          'masterKey',
          'releaseKey',
          'shareData',
          'encryptedData',
          'ciphertext',
          'signature',
          'hash',
          'salt',
          'iv',
          'nonce',
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'body.password',
          'body.passphrase',
          'body.secret',
          'body.privateKey',
          'body.masterKey',
          'body.releaseKey',
          'body.shareData',
          'body.encryptedData',
          'query.token',
          'query.key',
          'params.secret'
        ],
        censor: '[REDACTED]'
      },
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ...object,
          service: 'last-words-api',
          version: process.env.npm_package_version || '1.0.0',
          environment: this.configService.get('NODE_ENV', 'development'),
          hostname: require('os').hostname(),
          pid: process.pid
        })
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err
      }
    });

    // Dedicated audit logger for security events
    this.auditLogger = pino({
      level: 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => ({
          ...object,
          type: 'audit',
          service: 'last-words-api',
          environment: this.configService.get('NODE_ENV', 'development')
        })
      },
      timestamp: pino.stdTimeFunctions.isoTime
    });
  }

  log(message: string, context?: LogContext) {
    this.logger.info({ ...context }, message);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error({ ...context, trace }, message);
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn({ ...context }, message);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug({ ...context }, message);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.trace({ ...context }, message);
  }

  // Structured logging methods
  logRequest(req: any, res: any, duration: number) {
    const context = {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 400) {
      this.logger.warn(context, 'HTTP request completed with error');
    } else {
      this.logger.info(context, 'HTTP request completed');
    }
  }

  logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, context?: LogContext) {
    this.logger.info({
      ...context,
      operation,
      table,
      duration,
      success,
      type: 'database'
    }, `Database ${operation} on ${table}`);
  }

  logCryptoOperation(operation: string, success: boolean, duration: number, context?: LogContext) {
    this.logger.info({
      ...context,
      operation,
      success,
      duration,
      type: 'crypto'
    }, `Cryptographic operation: ${operation}`);
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    this.logger.warn({
      ...context,
      event,
      severity,
      type: 'security'
    }, `Security event: ${event}`);
  }

  // Audit logging for compliance and security
  audit(entry: Omit<AuditLogEntry, 'timestamp' | 'level'>) {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      level: 'audit'
    };

    this.auditLogger.info(auditEntry, `Audit: ${entry.action} on ${entry.resource}`);
  }

  // Performance monitoring
  logPerformanceMetric(metric: string, value: number, unit: string, context?: LogContext) {
    this.logger.info({
      ...context,
      metric,
      value,
      unit,
      type: 'performance'
    }, `Performance metric: ${metric}`);
  }

  // Business event logging
  logBusinessEvent(event: string, data: Record<string, any>, context?: LogContext) {
    this.logger.info({
      ...context,
      event,
      data,
      type: 'business'
    }, `Business event: ${event}`);
  }

  // Error tracking with context
  logError(error: Error, context?: LogContext & { operation?: string; userId?: string }) {
    this.logger.error({
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      type: 'error'
    }, `Error in ${context?.operation || 'unknown operation'}`);
  }

  // Health check logging
  logHealthCheck(service: string, status: 'healthy' | 'unhealthy', details?: Record<string, any>) {
    const level = status === 'healthy' ? 'info' : 'error';
    this.logger[level]({
      service,
      status,
      details,
      type: 'health'
    }, `Health check: ${service} is ${status}`);
  }

  // Rate limiting events
  logRateLimit(identifier: string, limit: number, current: number, context?: LogContext) {
    this.logger.warn({
      ...context,
      identifier,
      limit,
      current,
      type: 'rate-limit'
    }, `Rate limit approached: ${current}/${limit}`);
  }

  // Authentication events
  logAuthEvent(event: 'login' | 'logout' | 'failed_login' | 'token_refresh', userId?: string, context?: LogContext) {
    this.audit({
      ...context,
      userId,
      operation: 'authentication',
      resource: 'user_session',
      action: event,
      result: event.includes('failed') ? 'failure' : 'success'
    });
  }

  // Crypto operation audit
  logCryptoAudit(operation: string, success: boolean, context?: LogContext) {
    this.audit({
      ...context,
      operation: 'cryptography',
      resource: 'crypto_service',
      action: operation,
      result: success ? 'success' : 'failure'
    });
  }

  // Shamir secret sharing audit
  logShamirAudit(action: 'distribute' | 'combine' | 'retrieve', willId: string, context?: LogContext) {
    this.audit({
      ...context,
      operation: 'shamir_secret_sharing',
      resource: `will_${willId}`,
      action,
      result: 'success'
    });
  }

  // Release event audit
  logReleaseAudit(action: string, willId: string, beneficiaryId?: string, context?: LogContext) {
    this.audit({
      ...context,
      userId: beneficiaryId,
      operation: 'release_event',
      resource: `will_${willId}`,
      action,
      result: 'success'
    });
  }
}
