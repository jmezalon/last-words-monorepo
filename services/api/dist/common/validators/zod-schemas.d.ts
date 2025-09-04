import { z } from 'zod';
export declare const BaseEntitySchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    encryptedPersonalData: z.ZodOptional<z.ZodString>;
    masterKeyWrapped: z.ZodOptional<z.ZodString>;
    keyDerivationSalt: z.ZodOptional<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}, {
    email?: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}>;
export declare const UpdateUserSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    encryptedPersonalData: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    masterKeyWrapped: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    keyDerivationSalt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    timezone: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}, {
    email?: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}>;
export declare const CreateBeneficiarySchema: z.ZodObject<{
    encryptedContactData: z.ZodString;
    emailHmac: z.ZodString;
    verificationMethod: z.ZodDefault<z.ZodEnum<["email", "sms", "manual"]>>;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    emailHmac?: string;
    priority?: number;
    encryptedContactData?: string;
    verificationMethod?: "email" | "sms" | "manual";
}, {
    emailHmac?: string;
    priority?: number;
    encryptedContactData?: string;
    verificationMethod?: "email" | "sms" | "manual";
}>;
export declare const UpdateBeneficiarySchema: z.ZodObject<{
    encryptedContactData: z.ZodOptional<z.ZodString>;
    emailHmac: z.ZodOptional<z.ZodString>;
    verificationMethod: z.ZodOptional<z.ZodDefault<z.ZodEnum<["email", "sms", "manual"]>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    emailHmac?: string;
    priority?: number;
    encryptedContactData?: string;
    verificationMethod?: "email" | "sms" | "manual";
}, {
    emailHmac?: string;
    priority?: number;
    encryptedContactData?: string;
    verificationMethod?: "email" | "sms" | "manual";
}>;
export declare const CreateWillSchema: z.ZodObject<{
    encryptedTitle: z.ZodString;
    encryptedDescription: z.ZodOptional<z.ZodString>;
    encryptedContent: z.ZodString;
    requiresWebAuthn: z.ZodDefault<z.ZodBoolean>;
    accessLevel: z.ZodDefault<z.ZodEnum<["PRIVATE", "BENEFICIARY_ONLY", "PUBLIC"]>>;
    releaseConditions: z.ZodRecord<z.ZodString, z.ZodAny>;
    autoReleaseEnabled: z.ZodDefault<z.ZodBoolean>;
    manualReleaseEnabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    releaseConditions?: Record<string, any>;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
}, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    releaseConditions?: Record<string, any>;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
}>;
export declare const UpdateWillSchema: z.ZodObject<{
    encryptedTitle: z.ZodOptional<z.ZodString>;
    encryptedDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    encryptedContent: z.ZodOptional<z.ZodString>;
    requiresWebAuthn: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    accessLevel: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PRIVATE", "BENEFICIARY_ONLY", "PUBLIC"]>>>;
    releaseConditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    autoReleaseEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    manualReleaseEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    releaseConditions?: Record<string, any>;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
}, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    releaseConditions?: Record<string, any>;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
}>;
export declare const CreateSecretSchema: z.ZodObject<{
    willId: z.ZodString;
    encryptedTitle: z.ZodString;
    encryptedDescription: z.ZodOptional<z.ZodString>;
    secretType: z.ZodString;
    encryptedContent: z.ZodString;
    encryptedMetadata: z.ZodOptional<z.ZodString>;
    requiresWebAuthn: z.ZodDefault<z.ZodBoolean>;
    accessLevel: z.ZodDefault<z.ZodEnum<["PRIVATE", "BENEFICIARY_ONLY", "PUBLIC"]>>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    willId?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
}, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    willId?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
}>;
export declare const CreateSecretDtoSchema: z.ZodObject<{
    willId: z.ZodOptional<z.ZodString>;
    encryptedTitle: z.ZodOptional<z.ZodString>;
    encryptedDescription: z.ZodOptional<z.ZodString>;
    encryptedContent: z.ZodOptional<z.ZodString>;
    secretType: z.ZodOptional<z.ZodString>;
    encryptedMetadata: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodOptional<z.ZodNumber>;
    requiresWebAuthn: z.ZodOptional<z.ZodBoolean>;
    accessLevel: z.ZodOptional<z.ZodString>;
    encryptedCIK: z.ZodString;
    ciphertext: z.ZodString;
    nonce: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: string;
    willId?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
    encryptedCIK?: string;
    ciphertext?: string;
    nonce?: string;
    title?: string;
    description?: string;
}, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: string;
    willId?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
    encryptedCIK?: string;
    ciphertext?: string;
    nonce?: string;
    title?: string;
    description?: string;
}>;
export type CreateSecretDto = z.infer<typeof CreateSecretDtoSchema>;
export declare const UpdateSecretSchema: z.ZodObject<Omit<{
    willId: z.ZodOptional<z.ZodString>;
    encryptedTitle: z.ZodOptional<z.ZodString>;
    encryptedDescription: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    secretType: z.ZodOptional<z.ZodString>;
    encryptedContent: z.ZodOptional<z.ZodString>;
    encryptedMetadata: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    requiresWebAuthn: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    accessLevel: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PRIVATE", "BENEFICIARY_ONLY", "PUBLIC"]>>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "willId">, "strip", z.ZodTypeAny, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
}, {
    requiresWebAuthn?: boolean;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    accessLevel?: "PRIVATE" | "BENEFICIARY_ONLY" | "PUBLIC";
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
}>;
export declare const CreateAliveCheckSchema: z.ZodObject<{
    checkType: z.ZodEnum<["manual", "email_response", "app_checkin", "biometric"]>;
    intervalDays: z.ZodDefault<z.ZodNumber>;
    gracePeriodDays: z.ZodDefault<z.ZodNumber>;
    maxMissedBeforeTrigger: z.ZodDefault<z.ZodNumber>;
    encryptedNotificationConfig: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    checkType?: "manual" | "email_response" | "app_checkin" | "biometric";
    intervalDays?: number;
    gracePeriodDays?: number;
    maxMissedBeforeTrigger?: number;
    encryptedNotificationConfig?: string;
}, {
    checkType?: "manual" | "email_response" | "app_checkin" | "biometric";
    intervalDays?: number;
    gracePeriodDays?: number;
    maxMissedBeforeTrigger?: number;
    encryptedNotificationConfig?: string;
}>;
export declare const UpdateAliveCheckSchema: z.ZodObject<{
    checkType: z.ZodOptional<z.ZodEnum<["manual", "email_response", "app_checkin", "biometric"]>>;
    intervalDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    gracePeriodDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    maxMissedBeforeTrigger: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    encryptedNotificationConfig: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    checkType?: "manual" | "email_response" | "app_checkin" | "biometric";
    intervalDays?: number;
    gracePeriodDays?: number;
    maxMissedBeforeTrigger?: number;
    encryptedNotificationConfig?: string;
}, {
    checkType?: "manual" | "email_response" | "app_checkin" | "biometric";
    intervalDays?: number;
    gracePeriodDays?: number;
    maxMissedBeforeTrigger?: number;
    encryptedNotificationConfig?: string;
}>;
export declare const CreateReleaseEventSchema: z.ZodObject<{
    willId: z.ZodOptional<z.ZodString>;
    beneficiaryId: z.ZodOptional<z.ZodString>;
    eventType: z.ZodEnum<["manual_release", "auto_release", "alive_check_failed", "emergency"]>;
    triggerReason: z.ZodString;
    encryptedEventData: z.ZodOptional<z.ZodString>;
    requiresApproval: z.ZodDefault<z.ZodBoolean>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    willId?: string;
    beneficiaryId?: string;
    eventType?: "manual_release" | "auto_release" | "alive_check_failed" | "emergency";
    triggerReason?: string;
    encryptedEventData?: string;
    requiresApproval?: boolean;
    ipAddress?: string;
    userAgent?: string;
}, {
    willId?: string;
    beneficiaryId?: string;
    eventType?: "manual_release" | "auto_release" | "alive_check_failed" | "emergency";
    triggerReason?: string;
    encryptedEventData?: string;
    requiresApproval?: boolean;
    ipAddress?: string;
    userAgent?: string;
}>;
export declare const CreateAuditLogSchema: z.ZodObject<{
    action: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodOptional<z.ZodString>;
    encryptedDetails: z.ZodOptional<z.ZodString>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    riskLevel: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    flagged: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    encryptedDetails?: string;
    sessionId?: string;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    flagged?: boolean;
}, {
    ipAddress?: string;
    userAgent?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    encryptedDetails?: string;
    sessionId?: string;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    flagged?: boolean;
}>;
export declare const PaginationSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    orderBy: z.ZodDefault<z.ZodString>;
    orderDirection: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    orderBy?: string;
    cursor?: string;
    limit?: number;
    orderDirection?: "asc" | "desc";
}, {
    orderBy?: string;
    cursor?: string;
    limit?: number;
    orderDirection?: "asc" | "desc";
}>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateBeneficiaryDto = z.infer<typeof CreateBeneficiarySchema>;
export type UpdateBeneficiaryDto = z.infer<typeof UpdateBeneficiarySchema>;
export type CreateWillDto = z.infer<typeof CreateWillSchema>;
export type UpdateWillDto = z.infer<typeof UpdateWillSchema>;
export type CreateSecretDtoOld = z.infer<typeof CreateSecretSchema>;
export type UpdateSecretDto = z.infer<typeof UpdateSecretSchema>;
export type CreateAliveCheckDto = z.infer<typeof CreateAliveCheckSchema>;
export type UpdateAliveCheckDto = z.infer<typeof UpdateAliveCheckSchema>;
export type CreateReleaseEventDto = z.infer<typeof CreateReleaseEventSchema>;
export type CreateAuditLogDto = z.infer<typeof CreateAuditLogSchema>;
export type PaginationDto = z.infer<typeof PaginationSchema>;
