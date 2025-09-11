import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CryptoModule } from './crypto/crypto.module';
import { ShamirModule } from './shamir/shamir.module';
import { ReleaseModule } from './release/release.module';
import { HealthController } from './health/health.controller';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CorsMiddleware } from './common/middleware/cors.middleware';
import { CryptoController } from './controllers/crypto.controller';
import { CryptoService } from './services/crypto.service';
import { AuditService } from './services/audit.service';
import { SchedulerModule } from './scheduler/scheduler.module';
import { WebAuthnModule } from './webauthn/webauthn.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { AuthGuard } from './common/guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CryptoModule,
    ShamirModule,
    ReleaseModule,
    WebAuthnModule,
    RepositoriesModule,
    SchedulerModule,
  ],
  controllers: [AppController, CryptoController, HealthController],
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
