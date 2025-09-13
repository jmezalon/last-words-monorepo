import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsMiddleware } from '../common/middleware/metrics.middleware';
import { AuditChainService } from '../common/audit/audit-chain.service';
import { CustomLoggerService } from '../common/logger/logger.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('metrics')
@UseGuards(AuthGuard)
export class MetricsController {
  constructor(
    private readonly metricsMiddleware: MetricsMiddleware,
    private readonly auditChain: AuditChainService,
    private readonly logger: CustomLoggerService,
  ) {}

  @Get()
  async getMetrics() {
    const metrics = this.metricsMiddleware.getMetrics();
    
    this.logger.logBusinessEvent('metrics_accessed', {
      totalRequests: metrics.totalRequests,
      totalErrors: metrics.totalErrors,
      uptime: metrics.uptime
    });

    return {
      timestamp: new Date().toISOString(),
      service: 'last-words-api',
      ...metrics
    };
  }

  @Get('health')
  async getHealthMetrics() {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check audit chain health
      const auditHealth = await this.auditChain.validateAuditChain();
      const auditStats = await this.auditChain.getAuditStatistics();
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealth.status === 'healthy',
          auditChain: auditHealth.isValid
        },
        metrics: {
          totalEntries: auditStats.totalEntries,
          uptime: process.uptime(),
          invalidEntries: auditHealth.errors.length
        }
      };

      this.logger.logHealthCheck('api-service', 'healthy', health);
      
      return health;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const health = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: duration
      };

      this.logger.logHealthCheck('api-service', 'unhealthy', health);
      
      return health;
    }
  }

  @Get('audit-stats')
  async getAuditStats(@Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    const auditStats = await this.auditChain.getAuditStatistics();
    
    this.logger.logBusinessEvent('audit_stats_accessed', {
      timeRange,
      totalEntries: auditStats.totalEntries
    });

    return auditStats;
  }

  @Get('alerts')
  async getActiveAlerts() {
    const metrics = this.metricsMiddleware.getMetrics();
    const alerts = [];

    // High error rate alerts
    metrics.routes.forEach(route => {
      if (route.errorRate > 10 && route.requests > 10) {
        alerts.push({
          type: 'high_error_rate',
          severity: 'high',
          message: `High error rate on ${route.route}: ${route.errorRate.toFixed(1)}%`,
          details: route
        });
      }
    });

    // High latency alerts
    metrics.routes.forEach(route => {
      if (route.p95Latency > 2000) { // 2 seconds
        alerts.push({
          type: 'high_latency',
          severity: 'medium',
          message: `High P95 latency on ${route.route}: ${route.p95Latency}ms`,
          details: route
        });
      }
    });

    // Release attempt spike detection
    const releaseRoutes = metrics.routes.filter(r => r.route.includes('/release/'));
    const totalReleaseAttempts = releaseRoutes.reduce((sum, r) => sum + r.requests, 0);
    
    if (totalReleaseAttempts > 50) { // Threshold for release attempts
      alerts.push({
        type: 'release_attempt_spike',
        severity: 'critical',
        message: `Unusual number of release attempts: ${totalReleaseAttempts}`,
        details: { totalReleaseAttempts, routes: releaseRoutes }
      });
    }

    return {
      timestamp: new Date().toISOString(),
      alertCount: alerts.length,
      alerts
    };
  }

  @Get('performance')
  async getPerformanceMetrics(@Query('timeRange') timeRange: '1h' | '24h' | '7d' = '24h') {
    const metrics = this.metricsMiddleware.getMetrics();
    
    // Calculate performance indicators
    const performanceData = {
      timestamp: new Date().toISOString(),
      timeRange,
      overview: {
        totalRequests: metrics.totalRequests,
        totalErrors: metrics.totalErrors,
        errorRate: metrics.totalRequests > 0 ? (metrics.totalErrors / metrics.totalRequests) * 100 : 0,
        activeRequests: metrics.activeRequests,
        uptime: metrics.uptime
      },
      endpoints: metrics.routes.map(route => ({
        endpoint: route.route,
        requestCount: route.requests,
        errorCount: route.errors,
        errorRate: route.errorRate,
        avgLatency: route.avgLatency,
        p95Latency: route.p95Latency,
        performance: this.getPerformanceRating(route)
      })),
      criticalEndpoints: metrics.routes
        .filter(r => r.route.includes('/crypto/') || r.route.includes('/shamir/') || r.route.includes('/release/'))
        .map(route => ({
          endpoint: route.route,
          requestCount: route.requests,
          errorRate: route.errorRate,
          avgLatency: route.avgLatency,
          p95Latency: route.p95Latency,
          securityRisk: this.getSecurityRisk(route)
        }))
    };

    return performanceData;
  }

  private async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.auditChain['prisma'].$queryRaw`SELECT 1`;
      const duration = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: duration,
        connection: 'active'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connection: 'failed'
      };
    }
  }

  private async checkAuditHealth() {
    try {
      const start = Date.now();
      const validation = await this.auditChain.validateAuditChain();
      const stats = await this.auditChain.getAuditStatistics();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        audit: {
          totalEntries: stats.totalEntries,
          isValid: validation.isValid,
          invalidEntries: validation.errors.length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  private getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'healthy',
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  private getPerformanceRating(route: any): 'excellent' | 'good' | 'fair' | 'poor' {
    if (route.errorRate > 5 || route.p95Latency > 3000) return 'poor';
    if (route.errorRate > 2 || route.p95Latency > 1500) return 'fair';
    if (route.errorRate > 0.5 || route.p95Latency > 500) return 'good';
    return 'excellent';
  }

  private getSecurityRisk(route: any): 'low' | 'medium' | 'high' | 'critical' {
    if (route.route.includes('/release/') && route.errorRate > 10) return 'critical';
    if (route.route.includes('/crypto/') && route.errorRate > 5) return 'high';
    if (route.route.includes('/shamir/') && route.errorRate > 5) return 'high';
    if (route.errorRate > 15) return 'high';
    if (route.errorRate > 5) return 'medium';
    return 'low';
  }
}
