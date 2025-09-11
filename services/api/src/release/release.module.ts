import { Module } from '@nestjs/common';
import { ReleaseController } from './release.controller';
import { ReleaseService } from './release.service';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../services/crypto.service';
import { WorkingUserRepository } from '../repositories/working-user.repository';
import { WorkingSecretRepository } from '../repositories/working-secret.repository';

@Module({
  imports: [],
  controllers: [ReleaseController],
  providers: [
    ReleaseService,
    CryptoService,
    PrismaService,
    WorkingUserRepository,
    WorkingSecretRepository,
  ],
  exports: [ReleaseService],
})
export class ReleaseModule {}
