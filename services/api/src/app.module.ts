import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { CryptoController } from './controllers/crypto.controller';
import { CryptoService } from './services/crypto.service';
import { AuditService } from './services/audit.service';
// import { SchedulerModule } from './scheduler/scheduler.module';
import { WebAuthnModule } from './webauthn/webauthn.module';
// import { RepositoriesModule } from './repositories/repositories.module';
import { AuthGuard } from './common/guards/auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { AuditModule } from './common/audit/audit.module';
import { ObservabilityModule } from './observability/observability.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    AuditModule,
    ObservabilityModule,
    PrismaModule,
    AuthModule,
    CryptoModule,
    ShamirModule,
    ReleaseModule,
    WebAuthnModule,
    // RepositoriesModule,
    // SchedulerModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware, SecurityHeadersMiddleware, MetricsMiddleware)
      .forRoutes('*');
  }
}
