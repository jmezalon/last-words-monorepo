import { Injectable } from '@nestjs/common';
// import { AuditLogRepository } from '../repositories/audit-log.repository';
import { CreateAuditLogDto } from '../common/validators/zod-schemas';

@Injectable()
export class AuditService {
  // constructor(private auditLogRepository: AuditLogRepository) {}

  async logAction(
    action: string,
    entityType: string,
    entityId?: string,
    userId?: string,
    details?: Record<string, any>,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW',
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    const auditData: CreateAuditLogDto = {
      action,
      entityType,
      entityId,
      encryptedDetails: details ? JSON.stringify(details) : undefined,
      ipAddress: request?.ip,
      userAgent: request?.userAgent,
      sessionId: request?.sessionId,
      riskLevel,
      flagged: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
    };
    // TODO: Implement audit logging when repository is available
    console.log('Audit log:', { auditData, userId });
  }

  async logUserAction(
    action: string,
    userId: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.logAction(
      action,
      entityType,
      entityId,
      userId,
      details,
      'LOW',
      request
    );
  }

  async logSecurityEvent(
    action: string,
    userId: string,
    details: Record<string, any>,
    riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH',
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.logAction(
      action,
      'security',
      undefined,
      userId,
      details,
      riskLevel,
      request
    );
  }

  async logWillRelease(
    willId: string,
    userId: string,
    triggerReason: string,
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    await this.logAction(
      'will_released',
      'will',
      willId,
      userId,
      { triggerReason },
      'CRITICAL',
      request
    );
  }

  async logDataAccess(
    entityType: string,
    entityId: string,
    userId: string,
    accessType: 'read' | 'write' | 'delete',
    request?: { ip?: string; userAgent?: string; sessionId?: string }
  ): Promise<void> {
    const riskLevel = accessType === 'delete' ? 'HIGH' : 'LOW';
    await this.logAction(
      `${entityType}_${accessType}`,
      entityType,
      entityId,
      userId,
      { accessType },
      riskLevel,
      request
    );
  }
}
