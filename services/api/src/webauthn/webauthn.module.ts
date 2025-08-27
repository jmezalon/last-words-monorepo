import { Module } from '@nestjs/common';
import { WebAuthnController } from './webauthn.controller';
import { WebAuthnService } from './webauthn.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WebAuthnController],
  providers: [WebAuthnService, PrismaService],
  exports: [WebAuthnService],
})
export class WebAuthnModule {}
