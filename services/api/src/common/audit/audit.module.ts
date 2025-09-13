import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditChainService } from './audit-chain.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditChainService],
  exports: [AuditChainService],
})
export class AuditModule {}
