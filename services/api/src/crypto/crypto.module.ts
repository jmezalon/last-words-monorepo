import { Module } from '@nestjs/common';
import { CryptoService } from '../services/crypto.service';
import { CryptoController } from '../controllers/crypto.controller';

@Module({
  controllers: [CryptoController],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
