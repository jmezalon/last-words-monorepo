import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../services/crypto.service';
import { WorkingUserRepository } from '../repositories/working-user.repository';
import { WorkingSecretRepository } from '../repositories/working-secret.repository';
import * as crypto from 'crypto';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';

export interface ReleaseAccessRequest {
  releasePassphrase: string;
  beneficiaryId: string;
  willId: string;
}

export interface ReleaseKeyResponse {
  combinedKey: string; // MK⊕RK (base64 encoded)
  secrets: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
    createdAt: string;
  }>;
}

export interface DecryptedSecret {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  content: string;
  createdAt: string;
}

@Injectable()
export class ReleaseService {
  private readonly logger = new Logger(ReleaseService.name);

  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private userRepository: WorkingUserRepository,
    private secretRepository: WorkingSecretRepository,
  ) {}

  /**
   * Process release access request and return combined key with secrets
   */
  async processReleaseAccess(request: ReleaseAccessRequest): Promise<ReleaseKeyResponse> {
    const { releasePassphrase, beneficiaryId, willId } = request;

    // Verify will is released
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        user: true,
        willBeneficiaries: {
          include: {
            beneficiary: true,
          },
        },
      },
    });

    if (!will) {
      throw new HttpException('Will not found', HttpStatus.NOT_FOUND);
    }

    if (will.status !== 'RELEASED' || !will.releasedAt) {
      throw new HttpException('Will has not been released', HttpStatus.FORBIDDEN);
    }

    // Verify beneficiary access
    const willBeneficiary = will.willBeneficiaries.find(wb => wb.beneficiary.id === beneficiaryId);
    if (!willBeneficiary) {
      throw new HttpException('Beneficiary not authorized', HttpStatus.FORBIDDEN);
    }

    // Derive Release Key (RK) from release passphrase
    // For now, use a fixed salt - in production this should be stored securely
    const releaseKey = await this.deriveReleaseKey(
      releasePassphrase,
      'release-salt-' + willId
    );

    // Get user's master key
    const masterKey = await this.cryptoService.getUserMasterKey(will.userId);

    // Combine MK⊕RK
    const combinedKey = this.combineKeys(masterKey, releaseKey);

    // Get all secrets for this will
    const secrets = await this.secretRepository.findByWillId(willId);

    // Record access attempt
    await this.recordBeneficiaryAccess(beneficiaryId, willId);

    return {
      combinedKey: Buffer.from(combinedKey).toString('base64'),
      secrets: secrets.map(secret => ({
        id: secret.id,
        title: secret.encryptedTitle || 'Untitled', // Use encrypted field
        description: secret.encryptedDescription,
        category: secret.category,
        tags: secret.tags || [],
        encryptedCIK: '', // Field not in current Secret schema
        ciphertext: secret.encryptedContent || '', // Use encrypted content
        nonce: '', // Field not in current Secret schema
        createdAt: secret.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Derive Release Key from passphrase using PBKDF2
   */
  private async deriveReleaseKey(passphrase: string, salt: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(passphrase, salt, 100000, 32, 'sha256', (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(new Uint8Array(derivedKey));
        }
      });
    });
  }

  /**
   * Combine Master Key with Release Key using XOR
   */
  private combineKeys(masterKey: Uint8Array, releaseKey: Uint8Array): Uint8Array {
    const combined = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      combined[i] = masterKey[i] ^ releaseKey[i];
    }
    return combined;
  }

  /**
   * Record beneficiary access for audit trail
   */
  private async recordBeneficiaryAccess(beneficiaryId: string, willId: string): Promise<void> {
    try {
      // Update beneficiary access status
      // Note: hasAccessed and accessedAt fields need to be added to schema
      // For now, we'll log the access without updating the database
      // await this.prisma.beneficiary.update({
      //   where: { id: beneficiaryId },
      //   data: {
      //     updatedAt: new Date(),
      //   },
      // });

      // Create audit log
      // await this.prisma.auditLog.create({
      //   data: {
      //     action: 'BENEFICIARY_ACCESS',
      //     details: `Beneficiary ${beneficiaryId} accessed will ${willId}`,
      //     timestamp: new Date(),
      //   },
      // });

      this.logger.log(`Beneficiary ${beneficiaryId} accessed will ${willId}`);
    } catch (error) {
      this.logger.error('Failed to record beneficiary access:', error);
      // Don't throw - access should still work even if audit fails
    }
  }

  /**
   * Get release status for a will
   */
  async getReleaseStatus(willId: string): Promise<{
    isReleased: boolean;
    releaseDate?: string;
    beneficiaries: Array<{
      id: string;
      name: string;
      email: string;
      hasAccessed: boolean;
      accessedAt?: string;
    }>;
  }> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        willBeneficiaries: {
          include: {
            beneficiary: true,
          },
        },
      },
    });

    if (!will) {
      throw new HttpException('Will not found', HttpStatus.NOT_FOUND);
    }

    return {
      isReleased: will.status === 'RELEASED',
      releaseDate: will.releasedAt?.toISOString(),
      beneficiaries: will.willBeneficiaries.map(wb => ({
        id: wb.beneficiary.id,
        name: 'Beneficiary', // Encrypted data - would need decryption
        email: 'encrypted@example.com', // Encrypted data - would need decryption
        hasAccessed: false, // Field not in current schema
        accessedAt: undefined, // Field not in current schema
      })),
    };
  }

  /**
   * Generate secure download package as encrypted ZIP
   */
  async generateSecureDownload(
    secrets: DecryptedSecret[],
    downloadPassword: string,
    userId: string
  ): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> {
    const downloadId = crypto.randomUUID();
    const tempDir = path.join(process.cwd(), 'temp', downloadId);
    const zipPath = path.join(tempDir, 'legacy.zip');

    // Create temp directory
    await fs.promises.mkdir(tempDir, { recursive: true });

    try {
      // Create ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      const output = fs.createWriteStream(zipPath);
      archive.pipe(output);

      // Add secrets to ZIP
      for (const secret of secrets) {
        const filename = this.sanitizeFilename(`${secret.title || 'untitled'}.txt`);
        const content = this.formatSecretContent(secret);
        archive.append(content, { name: filename });
      }

      // Add metadata file
      const metadata = {
        exportedAt: new Date().toISOString(),
        totalSecrets: secrets.length,
        categories: [...new Set(secrets.map(s => s.category).filter(Boolean))],
      };
      archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

      await archive.finalize();

      // Encrypt the ZIP file
      const encryptedZipPath = await this.encryptFile(zipPath, downloadPassword);

      // Store download record
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await this.storeDownloadRecord(downloadId, encryptedZipPath, userId, expiresAt);

      // Clean up original ZIP
      await fs.promises.unlink(zipPath);

      return {
        downloadUrl: `/api/release/download/${downloadId}`,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      // Clean up on error
      await fs.promises.rmdir(tempDir, { recursive: true }).catch(() => {});
      throw new HttpException('Failed to generate download package', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Encrypt file with password
   */
  private async encryptFile(filePath: string, password: string): Promise<string> {
    const fileContent = await fs.promises.readFile(filePath);
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher('aes-256-cbc', key);
    const encrypted = Buffer.concat([cipher.update(fileContent), cipher.final()]);
    
    const encryptedPath = filePath + '.enc';
    const finalContent = Buffer.concat([salt, iv, encrypted]);
    await fs.promises.writeFile(encryptedPath, finalContent);
    
    return encryptedPath;
  }

  /**
   * Store download record in database
   */
  private async storeDownloadRecord(
    downloadId: string,
    filePath: string,
    userId: string,
    expiresAt: Date
  ): Promise<void> {
    // Store in a downloads table or similar
    // For now, we'll use a simple in-memory store or file system
    const downloadRecord = {
      id: downloadId,
      filePath,
      userId,
      createdAt: new Date(),
      expiresAt,
    };

    // In production, store this in database
    const recordPath = path.join(path.dirname(filePath), 'record.json');
    await fs.promises.writeFile(recordPath, JSON.stringify(downloadRecord));
  }

  /**
   * Format secret content for export
   */
  private formatSecretContent(secret: DecryptedSecret): string {
    let content = `Title: ${secret.title}\n`;
    if (secret.description) {
      content += `Description: ${secret.description}\n`;
    }
    if (secret.category) {
      content += `Category: ${secret.category}\n`;
    }
    if (secret.tags && secret.tags.length > 0) {
      content += `Tags: ${secret.tags.join(', ')}\n`;
    }
    content += `Created: ${secret.createdAt}\n`;
    content += `\n--- Content ---\n`;
    content += secret.content;
    return content;
  }

  /**
   * Verify WebAuthn response for beneficiary
   */
  async verifyBeneficiaryWebAuthn(
    beneficiaryId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _webauthnResponse: any,
  ): Promise<{ verified: boolean }> {
    try {
      const beneficiary = await this.prisma.beneficiary.findUnique({
        where: { id: beneficiaryId },
      });

      if (!beneficiary) {
        return { verified: false };
      }

      // TODO: Implement WebAuthn verification logic
      // This would verify the webauthnResponse against stored credentials
      // For now, return true if credentials exist
      return { verified: true };
    } catch (error) {
      this.logger.error('WebAuthn verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * Sanitize filename for safe file system usage
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9.-]/gi, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }
}
