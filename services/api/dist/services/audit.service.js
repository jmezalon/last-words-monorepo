"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
let AuditService = class AuditService {
    async logAction(action, entityType, entityId, userId, details, riskLevel = 'LOW', request) {
        const auditData = {
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
        console.log('Audit log:', { auditData, userId });
    }
    async logUserAction(action, userId, entityType, entityId, details, request) {
        await this.logAction(action, entityType, entityId, userId, details, 'LOW', request);
    }
    async logSecurityEvent(action, userId, details, riskLevel = 'HIGH', request) {
        await this.logAction(action, 'security', undefined, userId, details, riskLevel, request);
    }
    async logWillRelease(willId, userId, triggerReason, request) {
        await this.logAction('will_released', 'will', willId, userId, { triggerReason }, 'CRITICAL', request);
    }
    async logDataAccess(entityType, entityId, userId, accessType, request) {
        const riskLevel = accessType === 'delete' ? 'HIGH' : 'LOW';
        await this.logAction(`${entityType}_${accessType}`, entityType, entityId, userId, { accessType }, riskLevel, request);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)()
], AuditService);
//# sourceMappingURL=audit.service.js.map