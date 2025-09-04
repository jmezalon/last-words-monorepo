-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "aaguid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "encryptedPersonalData" TEXT,
    "emailHmac" TEXT NOT NULL,
    "masterKeyWrapped" TEXT,
    "keyDerivationSalt" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "notificationSettings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "encryptedContactData" TEXT NOT NULL,
    "emailHmac" TEXT NOT NULL,
    "accessKeyWrapped" TEXT,
    "verificationMethod" TEXT NOT NULL DEFAULT 'email',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationExpiresAt" DATETIME,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Will" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "encryptedTitle" TEXT NOT NULL,
    "encryptedDescription" TEXT,
    "encryptedContent" TEXT NOT NULL,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "requiresWebAuthn" BOOLEAN NOT NULL DEFAULT true,
    "accessLevel" TEXT NOT NULL DEFAULT 'PRIVATE',
    "releaseConditions" TEXT NOT NULL,
    "autoReleaseEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualReleaseEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "releasedAt" DATETIME,
    CONSTRAINT "Will_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WillBeneficiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "willId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL DEFAULT 'READ',
    "canTriggerRelease" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WillBeneficiary_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WillBeneficiary_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "willId" TEXT NOT NULL,
    "encryptedTitle" TEXT NOT NULL,
    "encryptedDescription" TEXT,
    "secretType" TEXT NOT NULL,
    "encryptedContent" TEXT NOT NULL,
    "encryptedMetadata" TEXT,
    "requiresWebAuthn" BOOLEAN NOT NULL DEFAULT true,
    "accessLevel" TEXT NOT NULL DEFAULT 'PRIVATE',
    "category" TEXT,
    "tags" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Secret_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AliveCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "intervalDays" INTEGER NOT NULL DEFAULT 30,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
    "lastCheckAt" DATETIME,
    "nextCheckDue" DATETIME NOT NULL,
    "consecutiveMissed" INTEGER NOT NULL DEFAULT 0,
    "maxMissedBeforeTrigger" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "encryptedNotificationConfig" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AliveCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReleaseEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "willId" TEXT,
    "beneficiaryId" TEXT,
    "eventType" TEXT NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "encryptedEventData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processedAt" DATETIME,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReleaseEvent_willId_fkey" FOREIGN KEY ("willId") REFERENCES "Will" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReleaseEvent_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "encryptedDetails" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHmac_key" ON "User"("emailHmac");

-- CreateIndex
CREATE INDEX "User_emailHmac_idx" ON "User"("emailHmac");

-- CreateIndex
CREATE INDEX "Beneficiary_userId_idx" ON "Beneficiary"("userId");

-- CreateIndex
CREATE INDEX "Beneficiary_emailHmac_idx" ON "Beneficiary"("emailHmac");

-- CreateIndex
CREATE INDEX "Will_userId_idx" ON "Will"("userId");

-- CreateIndex
CREATE INDEX "Will_status_idx" ON "Will"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WillBeneficiary_willId_beneficiaryId_key" ON "WillBeneficiary"("willId", "beneficiaryId");

-- CreateIndex
CREATE INDEX "Secret_willId_idx" ON "Secret"("willId");

-- CreateIndex
CREATE INDEX "Secret_secretType_idx" ON "Secret"("secretType");

-- CreateIndex
CREATE INDEX "Secret_category_idx" ON "Secret"("category");

-- CreateIndex
CREATE INDEX "AliveCheck_userId_idx" ON "AliveCheck"("userId");

-- CreateIndex
CREATE INDEX "AliveCheck_nextCheckDue_idx" ON "AliveCheck"("nextCheckDue");

-- CreateIndex
CREATE INDEX "AliveCheck_isActive_isOverdue_idx" ON "AliveCheck"("isActive", "isOverdue");

-- CreateIndex
CREATE INDEX "ReleaseEvent_willId_idx" ON "ReleaseEvent"("willId");

-- CreateIndex
CREATE INDEX "ReleaseEvent_beneficiaryId_idx" ON "ReleaseEvent"("beneficiaryId");

-- CreateIndex
CREATE INDEX "ReleaseEvent_eventType_idx" ON "ReleaseEvent"("eventType");

-- CreateIndex
CREATE INDEX "ReleaseEvent_status_idx" ON "ReleaseEvent"("status");

-- CreateIndex
CREATE INDEX "ReleaseEvent_createdAt_idx" ON "ReleaseEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_riskLevel_idx" ON "AuditLog"("riskLevel");

-- CreateIndex
CREATE INDEX "AuditLog_flagged_idx" ON "AuditLog"("flagged");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
