import { Module } from '@nestjs/common';
import { ShamirController } from './shamir.controller';
import { ShamirService } from './shamir.service';
import { PrismaService } from '../prisma/prisma.service';
// import { EmailService } from '../scheduler/email.service';
import { CryptoService } from '../services/crypto.service';

@Module({
  controllers: [ShamirController],
  providers: [ShamirService, PrismaService, CryptoService],
  exports: [ShamirService],
})
export class ShamirModule {}
