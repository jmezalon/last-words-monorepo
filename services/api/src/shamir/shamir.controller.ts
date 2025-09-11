import { Controller, Post, Get, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ShamirService, ShamirDistributionRequest } from './shamir.service';

@Controller('shamir')
@UseGuards(JwtAuthGuard)
export class ShamirController {
  constructor(private readonly shamirService: ShamirService) {}

  /**
   * Distribute Shamir shares for a will
   */
  @Post('distribute')
  async distributeShares(@Body() request: ShamirDistributionRequest) {
    try {
      await this.shamirService.distributeShares(request);
      return { success: true, message: 'Shares distributed successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to distribute shares',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get share by distribution token (public endpoint for beneficiaries)
   */
  @Get('share/:token')
  async getShareByToken(@Param('token') token: string) {
    const share = await this.shamirService.getShareByToken(token);
    
    if (!share) {
      throw new HttpException('Share not found or invalid', HttpStatus.NOT_FOUND);
    }

    return {
      willId: share.willId,
      beneficiaryId: share.beneficiaryId,
      shareIndex: share.shareIndex,
      shareData: share.shareData,
    };
  }

  /**
   * Mark shares as used after successful reconstruction
   */
  @Post('mark-used')
  async markSharesAsUsed(@Body() body: { willId: string; shareIndices: number[] }) {
    await this.shamirService.markSharesAsUsed(body.willId, body.shareIndices);
    return { success: true, message: 'Shares marked as used' };
  }

  /**
   * Get share status for a will
   */
  @Get('status/:willId')
  async getShareStatus(@Param('willId') willId: string) {
    return await this.shamirService.getShareStatus(willId);
  }

  /**
   * Regenerate shares (in case of compromise)
   */
  @Post('regenerate')
  async regenerateShares(@Body() body: { willId: string; shares: any[] }) {
    await this.shamirService.regenerateShares(body.willId, body.shares);
    return { success: true, message: 'Shares regenerated successfully' };
  }
}
