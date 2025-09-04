import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CryptoService } from '../services/crypto.service';
import { CreateSecretDto } from '../common/validators/zod-schemas';

@Controller('crypto')
@UseGuards(JwtAuthGuard)
export class CryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('generate-cik')
  async generateCIK() {
    const cik = await this.cryptoService.generateCIK();
    
    return {
      cik: cik.toString('base64'),
      timestamp: new Date().toISOString()
    };
  }

  @Post('get-master-key')
  async getMasterKey(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const masterKey = await this.cryptoService.getUserMasterKey(userId);
    
    return {
      masterKey: Buffer.from(masterKey).toString('base64')
    };
  }

  @Post('upload-secret')
  async uploadSecret(@Request() req: any, @Body() secretData: CreateSecretDto) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    const secretId = await this.cryptoService.storeEncryptedSecret(userId, {
      encryptedCIK: secretData.encryptedCIK,
      ciphertext: secretData.ciphertext,
      nonce: secretData.nonce,
      title: secretData.title,
      description: secretData.description,
      category: secretData.category,
      tags: secretData.tags
    });
    
    return {
      secretId,
      success: true
    };
  }
}
