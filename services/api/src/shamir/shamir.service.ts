import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../scheduler/email.service';
import { CryptoService } from '../services/crypto.service';
import * as crypto from 'crypto';

export interface ShamirShareData {
  willId: string;
  beneficiaryId: string;
  shareIndex: number;
  xCoordinate: number;
  shareData: number[]; // 32 bytes for Release Key
}

export interface ShamirDistributionRequest {
  willId: string;
  shares: ShamirShareData[];
  releaseKeyHash: string;
}

@Injectable()
export class ShamirService {
  private readonly logger = new Logger(ShamirService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private cryptoService: CryptoService,
  ) {}

  /**
   * Store Shamir shares and distribute them via email
   */
  async distributeShares(request: ShamirDistributionRequest): Promise<void> {
    const { willId, shares, releaseKeyHash } = request;

    // Validate request
    if (shares.length !== 3) {
      throw new HttpException('Exactly 3 shares required for 2-of-3 scheme', HttpStatus.BAD_REQUEST);
    }

    // Verify will exists and belongs to user
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

    // Verify all beneficiaries are valid
    const beneficiaryIds = shares.map(s => s.beneficiaryId);
    const validBeneficiaries = will.willBeneficiaries
      .map(wb => wb.beneficiary)
      .filter(b => beneficiaryIds.includes(b.id));

    if (validBeneficiaries.length !== 3) {
      throw new HttpException('Invalid beneficiaries for shares', HttpStatus.BAD_REQUEST);
    }

    try {
      // Update will with Shamir configuration
      await this.prisma.will.update({
        where: { id: willId },
        data: {
          shamirEnabled: true,
          shamirThreshold: 2,
          shamirTotalShares: 3,
          shamirReleaseKeyHash: releaseKeyHash,
        },
      });

      // Store shares in database
      for (const shareData of shares) {
        const beneficiary = validBeneficiaries.find(b => b.id === shareData.beneficiaryId);
        if (!beneficiary) continue;

        // Encrypt share data for storage
        const encryptedShareData = await this.encryptShareData(shareData.shareData);

        // Generate distribution token
        const distributionToken = this.generateDistributionToken(shareData);

        await this.prisma.shamirShare.create({
          data: {
            willId,
            beneficiaryId: shareData.beneficiaryId,
            shareIndex: shareData.shareIndex,
            xCoordinate: shareData.xCoordinate,
            encryptedShareData,
            distributionToken,
          },
        });

        // Send share via email
        await this.sendShareEmail(beneficiary, distributionToken, will.encryptedTitle);
      }

      this.logger.log(`Successfully distributed Shamir shares for will ${willId}`);
    } catch (error) {
      this.logger.error(`Failed to distribute Shamir shares: ${error.message}`);
      throw new HttpException('Failed to distribute shares', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Retrieve share by distribution token
   */
  async getShareByToken(token: string): Promise<{
    willId: string;
    beneficiaryId: string;
    shareIndex: number;
    shareData: number[];
  } | null> {
    try {
      const share = await this.prisma.shamirShare.findUnique({
        where: { distributionToken: token },
        include: {
          will: true,
          beneficiary: true,
        },
      });

      if (!share) {
        return null;
      }

      // Check if share has been used
      if (share.isUsed) {
        throw new HttpException('Share has already been used', HttpStatus.FORBIDDEN);
      }

      // Increment access attempts
      await this.prisma.shamirShare.update({
        where: { id: share.id },
        data: {
          accessAttempts: { increment: 1 },
          lastAccessAttempt: new Date(),
        },
      });

      // Decrypt share data
      const shareData = await this.decryptShareData(share.encryptedShareData);

      return {
        willId: share.willId,
        beneficiaryId: share.beneficiaryId,
        shareIndex: share.shareIndex,
        shareData,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve share: ${error.message}`);
      return null;
    }
  }

  /**
   * Mark shares as used after successful reconstruction
   */
  async markSharesAsUsed(willId: string, shareIndices: number[]): Promise<void> {
    await this.prisma.shamirShare.updateMany({
      where: {
        willId,
        shareIndex: { in: shareIndices },
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    this.logger.log(`Marked shares ${shareIndices.join(', ')} as used for will ${willId}`);
  }

  /**
   * Get share status for a will
   */
  async getShareStatus(willId: string): Promise<{
    shamirEnabled: boolean;
    totalShares: number;
    distributedShares: number;
    usedShares: number;
    shares: Array<{
      shareIndex: number;
      beneficiaryId: string;
      isDistributed: boolean;
      isUsed: boolean;
      accessAttempts: number;
    }>;
  }> {
    const will = await this.prisma.will.findUnique({
      where: { id: willId },
      include: {
        shamirShares: {
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
      shamirEnabled: will.shamirEnabled,
      totalShares: will.shamirTotalShares || 0,
      distributedShares: will.shamirShares.filter(s => s.isDistributed).length,
      usedShares: will.shamirShares.filter(s => s.isUsed).length,
      shares: will.shamirShares.map(share => ({
        shareIndex: share.shareIndex,
        beneficiaryId: share.beneficiaryId,
        isDistributed: share.isDistributed,
        isUsed: share.isUsed,
        accessAttempts: share.accessAttempts,
      })),
    };
  }

  /**
   * Regenerate shares (in case of compromise)
   */
  async regenerateShares(willId: string, newShares: ShamirShareData[]): Promise<void> {
    // Mark existing shares as revoked
    await this.prisma.shamirShare.updateMany({
      where: { willId },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Create new distribution request
    const releaseKeyHash = crypto.randomBytes(32).toString('hex'); // This should come from client
    await this.distributeShares({
      willId,
      shares: newShares,
      releaseKeyHash,
    });

    this.logger.log(`Regenerated Shamir shares for will ${willId}`);
  }

  /**
   * Encrypt share data for database storage
   */
  private async encryptShareData(shareData: number[]): Promise<string> {
    const buffer = Buffer.from(shareData);
    const key = crypto.randomBytes(32);
    
    const cipher = crypto.createCipher('aes-256-gcm', key);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // In production, store the key securely (e.g., in a key management service)
    const result = {
      encrypted: encrypted.toString('base64'),
      key: key.toString('base64'),
      authTag: authTag.toString('base64'),
    };
    
    return JSON.stringify(result);
  }

  /**
   * Decrypt share data from database storage
   */
  private async decryptShareData(encryptedData: string): Promise<number[]> {
    try {
      const data = JSON.parse(encryptedData);
      const key = Buffer.from(data.key, 'base64');
      const authTag = Buffer.from(data.authTag, 'base64');
      const encrypted = Buffer.from(data.encrypted, 'base64');
      
      const decipher = crypto.createDecipher('aes-256-gcm', key);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return Array.from(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt share data');
    }
  }

  /**
   * Generate secure distribution token
   */
  private generateDistributionToken(shareData: ShamirShareData): string {
    const tokenData = {
      willId: shareData.willId,
      beneficiaryId: shareData.beneficiaryId,
      shareIndex: shareData.shareIndex,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
  }

  /**
   * Send share via email to beneficiary
   */
  private async sendShareEmail(
    beneficiary: any,
    distributionToken: string,
    willTitle: string
  ): Promise<void> {
    const shareUrl = `${process.env.FRONTEND_URL}/release/shamir/${distributionToken}`;
    
    const emailContent = `
      <h2>Shamir Secret Share - Digital Legacy Access</h2>
      
      <p>You have been designated as a beneficiary for a digital legacy that uses Shamir Secret Sharing for enhanced security.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>What is Shamir Secret Sharing?</h3>
        <p>The legacy creator has split their Release Key into 3 shares. Any 2 of the 3 beneficiaries can combine their shares to access the legacy. This ensures:</p>
        <ul>
          <li>No single person can access the legacy alone</li>
          <li>The legacy remains accessible even if one beneficiary loses their share</li>
          <li>Enhanced security through distributed trust</li>
        </ul>
      </div>
      
      <p><strong>Will:</strong> ${willTitle}</p>
      
      <p><strong>Your Share Token:</strong></p>
      <div style="background: #f1f3f4; padding: 10px; font-family: monospace; word-break: break-all; border: 1px solid #ddd;">
        ${distributionToken}
      </div>
      
      <p><strong>Access Instructions:</strong></p>
      <ol>
        <li>Visit the release portal: <a href="${shareUrl}">Access Your Share</a></li>
        <li>Enter your share token above</li>
        <li>Coordinate with at least one other beneficiary to combine shares</li>
        <li>Follow the instructions to reconstruct the Release Key</li>
      </ol>
      
      <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h4>⚠️ Important Security Notes:</h4>
        <ul>
          <li>Keep this share token secure and private</li>
          <li>This token is single-use and will expire after successful reconstruction</li>
          <li>You'll need to coordinate with other beneficiaries to access the legacy</li>
          <li>Contact the other beneficiaries if you need to access the legacy</li>
        </ul>
      </div>
      
      <p>If you have any questions or concerns, please contact our support team.</p>
    `;

    await this.emailService.sendEmail({
      to: beneficiary.email, // This would need to be decrypted in production
      subject: `Shamir Secret Share - Digital Legacy Access Required`,
      html: emailContent,
    });

    // Mark as distributed
    await this.prisma.shamirShare.updateMany({
      where: { distributionToken },
      data: {
        isDistributed: true,
        distributedAt: new Date(),
      },
    });
  }
}
