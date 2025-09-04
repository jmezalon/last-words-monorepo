"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationSchema = exports.CreateAuditLogSchema = exports.CreateReleaseEventSchema = exports.UpdateAliveCheckSchema = exports.CreateAliveCheckSchema = exports.UpdateSecretSchema = exports.CreateSecretDtoSchema = exports.CreateSecretSchema = exports.UpdateWillSchema = exports.CreateWillSchema = exports.UpdateBeneficiarySchema = exports.CreateBeneficiarySchema = exports.UpdateUserSchema = exports.CreateUserSchema = exports.BaseEntitySchema = void 0;
const zod_1 = require("zod");
exports.BaseEntitySchema = zod_1.z.object({
    id: zod_1.z.string().cuid(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().optional(),
    encryptedPersonalData: zod_1.z.string().optional(),
    masterKeyWrapped: zod_1.z.string().optional(),
    keyDerivationSalt: zod_1.z.string().optional(),
    timezone: zod_1.z.string().default('UTC'),
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial();
exports.CreateBeneficiarySchema = zod_1.z.object({
    encryptedContactData: zod_1.z.string(),
    emailHmac: zod_1.z.string(),
    verificationMethod: zod_1.z.enum(['email', 'sms', 'manual']).default('email'),
    priority: zod_1.z.number().int().min(1).default(1),
});
exports.UpdateBeneficiarySchema = exports.CreateBeneficiarySchema.partial();
exports.CreateWillSchema = zod_1.z.object({
    encryptedTitle: zod_1.z.string(),
    encryptedDescription: zod_1.z.string().optional(),
    encryptedContent: zod_1.z.string(),
    requiresWebAuthn: zod_1.z.boolean().default(true),
    accessLevel: zod_1.z
        .enum(['PRIVATE', 'BENEFICIARY_ONLY', 'PUBLIC'])
        .default('PRIVATE'),
    releaseConditions: zod_1.z.record(zod_1.z.any()),
    autoReleaseEnabled: zod_1.z.boolean().default(false),
    manualReleaseEnabled: zod_1.z.boolean().default(true),
});
exports.UpdateWillSchema = exports.CreateWillSchema.partial();
exports.CreateSecretSchema = zod_1.z.object({
    willId: zod_1.z.string().cuid(),
    encryptedTitle: zod_1.z.string(),
    encryptedDescription: zod_1.z.string().optional(),
    secretType: zod_1.z.string(),
    encryptedContent: zod_1.z.string(),
    encryptedMetadata: zod_1.z.string().optional(),
    requiresWebAuthn: zod_1.z.boolean().default(true),
    accessLevel: zod_1.z
        .enum(['PRIVATE', 'BENEFICIARY_ONLY', 'PUBLIC'])
        .default('PRIVATE'),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    priority: zod_1.z.number().int().min(1).default(1),
});
exports.CreateSecretDtoSchema = zod_1.z.object({
    willId: zod_1.z.string().optional(),
    encryptedTitle: zod_1.z.string().optional(),
    encryptedDescription: zod_1.z.string().optional(),
    encryptedContent: zod_1.z.string().optional(),
    secretType: zod_1.z.string().optional(),
    encryptedMetadata: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    priority: zod_1.z.number().optional(),
    requiresWebAuthn: zod_1.z.boolean().optional(),
    accessLevel: zod_1.z.string().optional(),
    encryptedCIK: zod_1.z.string(),
    ciphertext: zod_1.z.string(),
    nonce: zod_1.z.string(),
    title: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
exports.UpdateSecretSchema = exports.CreateSecretSchema.partial().omit({
    willId: true,
});
exports.CreateAliveCheckSchema = zod_1.z.object({
    checkType: zod_1.z.enum(['manual', 'email_response', 'app_checkin', 'biometric']),
    intervalDays: zod_1.z.number().int().min(1).default(30),
    gracePeriodDays: zod_1.z.number().int().min(1).default(7),
    maxMissedBeforeTrigger: zod_1.z.number().int().min(1).default(3),
    encryptedNotificationConfig: zod_1.z.string().optional(),
});
exports.UpdateAliveCheckSchema = exports.CreateAliveCheckSchema.partial();
exports.CreateReleaseEventSchema = zod_1.z.object({
    willId: zod_1.z.string().cuid().optional(),
    beneficiaryId: zod_1.z.string().cuid().optional(),
    eventType: zod_1.z.enum([
        'manual_release',
        'auto_release',
        'alive_check_failed',
        'emergency',
    ]),
    triggerReason: zod_1.z.string(),
    encryptedEventData: zod_1.z.string().optional(),
    requiresApproval: zod_1.z.boolean().default(false),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
});
exports.CreateAuditLogSchema = zod_1.z.object({
    action: zod_1.z.string(),
    entityType: zod_1.z.string(),
    entityId: zod_1.z.string().optional(),
    encryptedDetails: zod_1.z.string().optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    riskLevel: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
    flagged: zod_1.z.boolean().default(false),
});
exports.PaginationSchema = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    orderBy: zod_1.z.string().default('createdAt'),
    orderDirection: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=zod-schemas.js.map