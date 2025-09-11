import { Controller, Post, Body, UseGuards, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ReleaseService } from './release.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

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

@Controller('release')
export class ReleaseController {
  constructor(private releaseService: ReleaseService) {}

  /**
   * Verify release access and get combined key for decryption
   */
  @Post('access')
  async requestReleaseAccess(@Body() request: ReleaseAccessRequest): Promise<ReleaseKeyResponse> {
    try {
      return await this.releaseService.processReleaseAccess(request);
    } catch (error) {
      throw new HttpException(
        'Invalid release credentials or will not released',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Get release status for a will
   */
  @Get('status/:willId')
  async getReleaseStatus(@Param('willId') willId: string): Promise<{
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
    return await this.releaseService.getReleaseStatus(willId);
  }

  /**
   * Generate secure download package (encrypted ZIP)
   */
  @Post('download')
  @UseGuards(JwtAuthGuard)
  async generateDownloadPackage(
    @Body() body: { 
      secrets: DecryptedSecret[];
      downloadPassword: string;
    },
    @User() user: any
  ): Promise<{
    downloadUrl: string;
    expiresAt: string;
  }> {
    return await this.releaseService.generateSecureDownload(
      body.secrets,
      body.downloadPassword,
      user.id
    );
  }

  /**
   * Verify beneficiary WebAuthn if required
   */
  @Post('verify-webauthn')
  async verifyBeneficiaryWebAuthn(@Body() body: {
    beneficiaryId: string;
    webauthnResponse: any;
  }): Promise<{ verified: boolean }> {
    return await this.releaseService.verifyBeneficiaryWebAuthn(
      body.beneficiaryId,
      body.webauthnResponse
    );
  }
}
