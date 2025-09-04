export declare class AuditService {
    logAction(action: string, entityType: string, entityId?: string, userId?: string, details?: Record<string, any>, riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', request?: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    logUserAction(action: string, userId: string, entityType: string, entityId?: string, details?: Record<string, any>, request?: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    logSecurityEvent(action: string, userId: string, details: Record<string, any>, riskLevel?: 'MEDIUM' | 'HIGH' | 'CRITICAL', request?: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    logWillRelease(willId: string, userId: string, triggerReason: string, request?: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
    logDataAccess(entityType: string, entityId: string, userId: string, accessType: 'read' | 'write' | 'delete', request?: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
    }): Promise<void>;
}
