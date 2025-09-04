-- Last Words Initial Database Schema Migration
-- This migration creates all tables for the secure digital legacy management system
-- All sensitive data is stored as encrypted blobs, emails as salted HMAC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE will_status AS ENUM ('DRAFT', 'ACTIVE', 'RELEASED', 'REVOKED');
CREATE TYPE access_level AS ENUM ('PRIVATE', 'BENEFICIARY_ONLY', 'PUBLIC');
CREATE TYPE verification_method AS ENUM ('email', 'sms', 'manual');
CREATE TYPE check_type AS ENUM ('manual', 'email_response', 'app_checkin', 'biometric');
CREATE TYPE event_type AS ENUM ('manual_release', 'auto_release', 'alive_check_failed', 'emergency');
CREATE TYPE event_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- NextAuth.js required tables
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "aaguid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("id")
);

-- Core Last Words tables
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    
    -- Encrypted user data (PII stored as encrypted blobs)
    "encryptedPersonalData" TEXT,
    "emailHmac" TEXT NOT NULL,
    "masterKeyWrapped" TEXT,
    "keyDerivationSalt" TEXT,
    
    -- User preferences and settings
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notificationSettings" JSONB,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Encrypted beneficiary data
    "encryptedContactData" TEXT NOT NULL,
    "emailHmac" TEXT NOT NULL,
    
    -- Access and verification
    "accessKeyWrapped" TEXT,
    "verificationMethod" verification_method NOT NULL DEFAULT 'email',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpiresAt" TIMESTAMP(3),
    
    -- Metadata
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Will" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Basic will metadata (encrypted)
    "encryptedTitle" TEXT NOT NULL,
    "encryptedDescription" TEXT,
    
    -- Will content (fully encrypted)
    "encryptedContent" TEXT NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    
    -- Access control
    "requiresWebAuthn" BOOLEAN NOT NULL DEFAULT true,
    "accessLevel" access_level NOT NULL DEFAULT 'PRIVATE',
    
    -- Release conditions
    "releaseConditions" JSONB NOT NULL,
    "autoReleaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualReleaseEnabled" BOOLEAN NOT NULL DEFAULT true,
    
    -- Status
    "status" will_status NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "Will_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WillBeneficiary" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    
    -- Access permissions for this beneficiary to this will
    "accessLevel" TEXT NOT NULL DEFAULT 'read',
    "canTriggerRelease" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WillBeneficiary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Secret" (
    "id" TEXT NOT NULL,
    "willId" TEXT NOT NULL,
    
    -- Secret metadata (encrypted)
    "encryptedTitle" TEXT NOT NULL,
    "encryptedDescription" TEXT,
    "secretType" TEXT NOT NULL,
    
    -- Secret content (fully encrypted)
    "encryptedContent" TEXT NOT NULL,
    "encryptedMetadata" TEXT,
    
    -- Access control
    "requiresWebAuthn" BOOLEAN NOT NULL DEFAULT true,
    "accessLevel" access_level NOT NULL DEFAULT 'PRIVATE',
    
    -- Organization
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 1,
    
    -- Status
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secret_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AliveCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    
    -- Check configuration
    "checkType" check_type NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 30,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    
    -- Check data
    "lastCheckAt" TIMESTAMP(3),
    "nextCheckDue" TIMESTAMP(3) NOT NULL,
    "consecutiveMissed" INTEGER NOT NULL DEFAULT 0,
    "maxMissedBeforeTrigger" INTEGER NOT NULL DEFAULT 3,
    
    -- Status
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    
    -- Notification settings (encrypted)
    "encryptedNotificationConfig" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AliveCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReleaseEvent" (
    "id" TEXT NOT NULL,
    "willId" TEXT,
    "beneficiaryId" TEXT,
    
    -- Event details
    "eventType" event_type NOT NULL,
    "triggerReason" TEXT NOT NULL,
    
    -- Event data (encrypted)
    "encryptedEventData" TEXT,
    
    -- Status and processing
    "status" event_status NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    
    -- Verification and approval
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    
    -- Metadata
    "ipAddress" TEXT,
    "userAgent" TEXT,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    
    -- Action details
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    
    -- Event context (encrypted)
    "encryptedDetails" TEXT,
    
    -- Request metadata
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    
    -- Risk and security
    "riskLevel" risk_level NOT NULL DEFAULT 'LOW',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_emailHmac_key" ON "User"("emailHmac");
CREATE UNIQUE INDEX "WillBeneficiary_willId_beneficiaryId_key" ON "WillBeneficiary"("willId", "beneficiaryId");

-- Create performance indexes
CREATE INDEX "User_emailHmac_idx" ON "User"("emailHmac");
CREATE INDEX "Beneficiary_userId_idx" ON "Beneficiary"("userId");
CREATE INDEX "Beneficiary_emailHmac_idx" ON "Beneficiary"("emailHmac");
CREATE INDEX "Will_userId_idx" ON "Will"("userId");
CREATE INDEX "Will_status_idx" ON "Will"("status");
CREATE INDEX "Secret_willId_idx" ON "Secret"("willId");
CREATE INDEX "Secret_secretType_idx" ON "Secret"("secretType");
CREATE INDEX "Secret_category_idx" ON "Secret"("category");
CREATE INDEX "AliveCheck_userId_idx" ON "AliveCheck"("userId");
CREATE INDEX "AliveCheck_nextCheckDue_idx" ON "AliveCheck"("nextCheckDue");
CREATE INDEX "AliveCheck_isActive_isOverdue_idx" ON "AliveCheck"("isActive", "isOverdue");
CREATE INDEX "ReleaseEvent_willId_idx" ON "ReleaseEvent"("willId");
CREATE INDEX "ReleaseEvent_beneficiaryId_idx" ON "ReleaseEvent"("beneficiaryId");
CREATE INDEX "ReleaseEvent_eventType_idx" ON "ReleaseEvent"("eventType");
CREATE INDEX "ReleaseEvent_status_idx" ON "ReleaseEvent"("status");
CREATE INDEX "ReleaseEvent_createdAt_idx" ON "ReleaseEvent"("createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_riskLevel_idx" ON "AuditLog"("riskLevel");
CREATE INDEX "AuditLog_flagged_idx" ON "AuditLog"("flagged");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Add foreign key constraints
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Will" ADD CONSTRAINT "Will_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WillBeneficiary" ADD CONSTRAINT "WillBeneficiary_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WillBeneficiary" ADD CONSTRAINT "WillBeneficiary_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AliveCheck" ADD CONSTRAINT "AliveCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseEvent" ADD CONSTRAINT "ReleaseEvent_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReleaseEvent" ADD CONSTRAINT "ReleaseEvent_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create security functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficiary_updated_at BEFORE UPDATE ON "Beneficiary" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_will_updated_at BEFORE UPDATE ON "Will" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_secret_updated_at BEFORE UPDATE ON "Secret" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alive_check_updated_at BEFORE UPDATE ON "AliveCheck" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_release_event_updated_at BEFORE UPDATE ON "ReleaseEvent" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_authenticator_updated_at BEFORE UPDATE ON "Authenticator" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies for enhanced security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Beneficiary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Will" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Secret" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AliveCheck" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY user_isolation ON "User" FOR ALL USING (id = current_setting('app.current_user_id', true)::text);
CREATE POLICY beneficiary_isolation ON "Beneficiary" FOR ALL USING (userId = current_setting('app.current_user_id', true)::text);
CREATE POLICY will_isolation ON "Will" FOR ALL USING (userId = current_setting('app.current_user_id', true)::text);
CREATE POLICY secret_isolation ON "Secret" FOR ALL USING (
    EXISTS (SELECT 1 FROM "Will" WHERE "Will".id = "Secret".willId AND "Will".userId = current_setting('app.current_user_id', true)::text)
);
CREATE POLICY alive_check_isolation ON "AliveCheck" FOR ALL USING (userId = current_setting('app.current_user_id', true)::text);
CREATE POLICY audit_log_isolation ON "AuditLog" FOR SELECT USING (userId = current_setting('app.current_user_id', true)::text);

-- Insert initial data
INSERT INTO "User" ("id", "email", "emailHmac", "name") VALUES 
('system', 'system@lastwords.app', 'system_hmac', 'System User');

COMMENT ON DATABASE postgres IS 'Last Words - Secure Digital Legacy Management System';
COMMENT ON TABLE "User" IS 'Users with encrypted personal data and salted email HMAC';
COMMENT ON TABLE "Beneficiary" IS 'Beneficiaries with encrypted contact data';
COMMENT ON TABLE "Will" IS 'Digital wills with encrypted content and release conditions';
COMMENT ON TABLE "Secret" IS 'Encrypted secrets associated with wills';
COMMENT ON TABLE "AliveCheck" IS 'Alive check configurations and status';
COMMENT ON TABLE "ReleaseEvent" IS 'Events that trigger will releases';
COMMENT ON TABLE "AuditLog" IS 'Immutable audit trail for security and compliance';
