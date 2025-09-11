import { Module, MiddlewareConsumer } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CryptoController } from './controllers/crypto.controller';
import { CryptoService } from './services/crypto.service';
import { AuditService } from './services/audit.service';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ReleaseModule } from './release/release.module';
import { WebAuthnModule } from './webauthn/webauthn.module';
import { ShamirModule } from './shamir/shamir.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RepositoriesModule } from './repositories/repositories.module';

@Module({
  imports: [
    AuthModule,
    WebAuthnModule,
    RepositoriesModule,
    ReleaseModule,
    ShamirModule,
    SchedulerModule,
  ],
  controllers: [AppController, CryptoController],
  providers: [
    AppService,
    CryptoService,
    AuditService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware, SecurityHeadersMiddleware).forRoutes('*');
  }
}
