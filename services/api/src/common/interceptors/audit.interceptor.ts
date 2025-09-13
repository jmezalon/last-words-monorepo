import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditChainService } from '../audit/audit-chain.service';
import { CustomLoggerService } from '../logger/logger.service';
import { AUDIT_METADATA_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditChain: AuditChainService,
    private readonly logger: CustomLoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract context information
    const userId = (request as any).user?.id;
    const sessionId = (request as any).session?.id || request.headers['x-session-id'] as string;
    const requestId = request.headers['x-request-id'] as string;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    // Prepare audit details
    const auditDetails: any = {
      endpoint: `${request.method} ${request.path}`,
      requestId,
    };

    // Log sensitive request data if configured
    if (auditOptions.logRequest && !auditOptions.sensitive) {
      auditDetails.requestBody = request.body;
      auditDetails.requestQuery = request.query;
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Add response data if configured
        if (auditOptions.logResponse && !auditOptions.sensitive && data) {
          auditDetails.responseData = data;
        }

        auditDetails.statusCode = statusCode;
        auditDetails.duration = duration;

        // Create audit entry
        this.auditChain.appendAuditEntry({
          timestamp: new Date(),
          userId,
          sessionId,
          operation: auditOptions.operation,
          resource: auditOptions.resource,
          action: auditOptions.action,
          result: statusCode < 400 ? 'success' : 'failure',
          details: auditDetails,
          ipAddress,
          userAgent,
          duration,
        }).catch(error => {
          this.logger.logError(error, {
            operation: 'audit_logging',
            userId,
            requestId
          });
        });

        // Log business event for audit
        this.logger.logBusinessEvent(
          `${auditOptions.operation}_${auditOptions.action}`,
          {
            resource: auditOptions.resource,
            result: 'success',
            duration,
            statusCode
          },
          {
            userId,
            sessionId,
            requestId,
            operation: auditOptions.operation
          }
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        auditDetails.statusCode = statusCode;
        auditDetails.duration = duration;
        auditDetails.error = {
          name: error.name,
          message: error.message,
          code: error.code
        };

        // Create audit entry for error
        this.auditChain.appendAuditEntry({
          timestamp: new Date(),
          userId,
          sessionId,
          operation: auditOptions.operation,
          resource: auditOptions.resource,
          action: auditOptions.action,
          result: 'error',
          details: auditDetails,
          ipAddress,
          userAgent,
          duration,
          errorCode: error.code || 'UNKNOWN_ERROR',
          errorMessage: error.message,
        }).catch(auditError => {
          this.logger.logError(auditError, {
            operation: 'audit_logging',
            userId,
            requestId
          });
        });

        // Log security event if this is a sensitive operation
        if (auditOptions.sensitive) {
          this.logger.logSecurityEvent(
            `Failed ${auditOptions.operation}: ${error.message}`,
            'high',
            {
              userId,
              sessionId,
              requestId,
              operation: auditOptions.operation,
              metadata: { resource: auditOptions.resource, action: auditOptions.action }
            }
          );
        }

        throw error;
      })
    );
  }
}
