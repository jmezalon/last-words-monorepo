import { SetMetadata } from '@nestjs/common';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditOptions {
  operation: string;
  resource: string;
  action: string;
  sensitive?: boolean;
  logRequest?: boolean;
  logResponse?: boolean;
}

export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_METADATA_KEY, options);

// Predefined audit decorators for common operations
export const AuditAuth = (action: string) => 
  Audit({ operation: 'authentication', resource: 'user_session', action });

export const AuditCrypto = (action: string) => 
  Audit({ operation: 'cryptography', resource: 'crypto_service', action, sensitive: true });

export const AuditShamir = (action: string) => 
  Audit({ operation: 'shamir_secret_sharing', resource: 'shamir_shares', action, sensitive: true });

export const AuditRelease = (action: string) => 
  Audit({ operation: 'release_event', resource: 'release_package', action, sensitive: true });

export const AuditWill = (action: string) => 
  Audit({ operation: 'will_management', resource: 'will_document', action, logRequest: true });

export const AuditUser = (action: string) => 
  Audit({ operation: 'user_management', resource: 'user_profile', action });
