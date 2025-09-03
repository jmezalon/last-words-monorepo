import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimpleUserRepository } from './simple-user.repository';

@Module({
  providers: [PrismaService, SimpleUserRepository],
  exports: [SimpleUserRepository],
})
export class RepositoriesModule {}
