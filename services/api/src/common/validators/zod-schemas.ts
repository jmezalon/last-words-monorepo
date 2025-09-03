import { z } from 'zod';

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  encryptedPersonalData: z.string().optional(),
  masterKeyWrapped: z.string().optional(),
  keyDerivationSalt: z.string().optional(),
  timezone: z.string().default('UTC'),
});

export const UpdateUserSchema = CreateUserSchema.partial();

// Beneficiary schemas
export const CreateBeneficiarySchema = z.object({
  encryptedContactData: z.string(),
  emailHmac: z.string(),
  verificationMethod: z.enum(['email', 'sms', 'manual']).default('email'),
  priority: z.number().int().min(1).default(1),
});

export const UpdateBeneficiarySchema = CreateBeneficiarySchema.partial();

// Will schemas
export const CreateWillSchema = z.object({
  encryptedTitle: z.string(),
  encryptedDescription: z.string().optional(),
  encryptedContent: z.string(),
  requiresWebAuthn: z.boolean().default(true),
  accessLevel: z
    .enum(['PRIVATE', 'BENEFICIARY_ONLY', 'PUBLIC'])
    .default('PRIVATE'),
  releaseConditions: z.record(z.any()),
  autoReleaseEnabled: z.boolean().default(false),
  manualReleaseEnabled: z.boolean().default(true),
});

export const UpdateWillSchema = CreateWillSchema.partial();

// Secret schemas
export const CreateSecretSchema = z.object({
  willId: z.string().cuid(),
  encryptedTitle: z.string(),
  encryptedDescription: z.string().optional(),
  secretType: z.string(),
  encryptedContent: z.string(),
  encryptedMetadata: z.string().optional(),
  requiresWebAuthn: z.boolean().default(true),
  accessLevel: z
    .enum(['PRIVATE', 'BENEFICIARY_ONLY', 'PUBLIC'])
    .default('PRIVATE'),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  priority: z.number().int().min(1).default(1),
});

export const UpdateSecretSchema = CreateSecretSchema.partial().omit({
  willId: true,
});

// Alive Check schemas
export const CreateAliveCheckSchema = z.object({
  checkType: z.enum(['manual', 'email_response', 'app_checkin', 'biometric']),
  intervalDays: z.number().int().min(1).default(30),
  gracePeriodDays: z.number().int().min(1).default(7),
  maxMissedBeforeTrigger: z.number().int().min(1).default(3),
  encryptedNotificationConfig: z.string().optional(),
});

export const UpdateAliveCheckSchema = CreateAliveCheckSchema.partial();

// Release Event schemas
export const CreateReleaseEventSchema = z.object({
  willId: z.string().cuid().optional(),
  beneficiaryId: z.string().cuid().optional(),
  eventType: z.enum([
    'manual_release',
    'auto_release',
    'alive_check_failed',
    'emergency',
  ]),
  triggerReason: z.string(),
  encryptedEventData: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Audit Log schemas
export const CreateAuditLogSchema = z.object({
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().optional(),
  encryptedDetails: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  flagged: z.boolean().default(false),
});

// Pagination schema
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  orderBy: z.string().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Export types
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateBeneficiaryDto = z.infer<typeof CreateBeneficiarySchema>;
export type UpdateBeneficiaryDto = z.infer<typeof UpdateBeneficiarySchema>;
export type CreateWillDto = z.infer<typeof CreateWillSchema>;
export type UpdateWillDto = z.infer<typeof UpdateWillSchema>;
export type CreateSecretDto = z.infer<typeof CreateSecretSchema>;
export type UpdateSecretDto = z.infer<typeof UpdateSecretSchema>;
export type CreateAliveCheckDto = z.infer<typeof CreateAliveCheckSchema>;
export type UpdateAliveCheckDto = z.infer<typeof UpdateAliveCheckSchema>;
export type CreateReleaseEventDto = z.infer<typeof CreateReleaseEventSchema>;
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
