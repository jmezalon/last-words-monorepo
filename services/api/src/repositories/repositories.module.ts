import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingUserRepository } from './working-user.repository';
import { WorkingWillRepository } from './working-will.repository';
import { WorkingSecretRepository } from './working-secret.repository';

@Module({
  providers: [
    PrismaService,
    WorkingUserRepository,
    WorkingWillRepository,
    WorkingSecretRepository,
  ],
  exports: [
    WorkingUserRepository,
    WorkingWillRepository,
    WorkingSecretRepository,
  ],
})
export class RepositoriesModule {}
