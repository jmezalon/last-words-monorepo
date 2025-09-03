import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WebAuthnModule } from './webauthn/webauthn.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AuditService } from './services/audit.service';
import { AuthGuard } from './common/guards/auth.guard';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [AuthModule, WebAuthnModule, RepositoriesModule],
  controllers: [AppController],
  providers: [
    AppService,
    AuditService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
