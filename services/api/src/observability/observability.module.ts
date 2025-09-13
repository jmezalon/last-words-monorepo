import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsMiddleware } from '../common/middleware/metrics.middleware';
import { LoggerModule } from '../common/logger/logger.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [LoggerModule, AuditModule],
  controllers: [MetricsController],
  providers: [MetricsMiddleware],
  exports: [MetricsMiddleware],
})
export class ObservabilityModule {}
