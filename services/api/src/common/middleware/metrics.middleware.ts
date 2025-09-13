import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CustomLoggerService } from '../logger/logger.service';

interface MetricsData {
  requests: Map<string, number>;
  errors: Map<string, number>;
  latencies: Map<string, number[]>;
  activeRequests: number;
  startTime: number;
}

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  private metrics: MetricsData = {
    requests: new Map(),
    errors: new Map(),
    latencies: new Map(),
    activeRequests: 0,
    startTime: Date.now()
  };

  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const route = `${req.method} ${this.normalizeRoute(req.path)}`;
    
    this.metrics.activeRequests++;

    // Track request count
    this.metrics.requests.set(route, (this.metrics.requests.get(route) || 0) + 1);

    // Override res.end to capture metrics
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      
      // Track latency
      if (!this.metrics.latencies.has(route)) {
        this.metrics.latencies.set(route, []);
      }
      this.metrics.latencies.get(route)!.push(duration);
      
      // Keep only last 100 latency measurements per route
      const latencies = this.metrics.latencies.get(route)!;
      if (latencies.length > 100) {
        latencies.shift();
      }

      // Track errors
      if (res.statusCode >= 400) {
        this.metrics.errors.set(route, (this.metrics.errors.get(route) || 0) + 1);
      }

      this.metrics.activeRequests--;

      // Log performance metrics
      this.logger.logPerformanceMetric('request_duration', duration, 'ms', {
        operation: route,
        metadata: { statusCode: res.statusCode }
      });

      // Alert on high latency
      if (duration > 5000) { // 5 seconds
        this.logger.logSecurityEvent(
          `High latency detected: ${route} took ${duration}ms`,
          'medium',
          { operation: route, metadata: { duration, statusCode: res.statusCode } }
        );
      }

      // Alert on error rate spike
      this.checkErrorRateSpike(route);

      originalEnd.call(res, chunk, encoding);
    }.bind(this);

    next();
  }

  private normalizeRoute(path: string): string {
    // Replace UUIDs and other dynamic segments with placeholders
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-zA-Z0-9]{20,}/g, '/:token');
  }

  private checkErrorRateSpike(route: string) {
    const requests = this.metrics.requests.get(route) || 0;
    const errors = this.metrics.errors.get(route) || 0;
    
    if (requests > 10 && (errors / requests) > 0.1) { // 10% error rate
      this.logger.logSecurityEvent(
        `High error rate detected: ${route} has ${((errors / requests) * 100).toFixed(1)}% error rate`,
        'high',
        { 
          operation: route, 
          metadata: { 
            requests, 
            errors, 
            errorRate: (errors / requests) * 100 
          } 
        }
      );
    }
  }

  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    
    const metricsSnapshot = {
      uptime,
      activeRequests: this.metrics.activeRequests,
      totalRequests: Array.from(this.metrics.requests.values()).reduce((a, b) => a + b, 0),
      totalErrors: Array.from(this.metrics.errors.values()).reduce((a, b) => a + b, 0),
      routes: Array.from(this.metrics.requests.keys()).map(route => {
        const requests = this.metrics.requests.get(route) || 0;
        const errors = this.metrics.errors.get(route) || 0;
        const latencies = this.metrics.latencies.get(route) || [];
        
        const avgLatency = latencies.length > 0 
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
          : 0;
        
        const p95Latency = latencies.length > 0 
          ? this.calculatePercentile(latencies, 95) 
          : 0;

        return {
          route,
          requests,
          errors,
          errorRate: requests > 0 ? (errors / requests) * 100 : 0,
          avgLatency: Math.round(avgLatency),
          p95Latency: Math.round(p95Latency)
        };
      })
    };

    return metricsSnapshot;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  resetMetrics() {
    this.metrics = {
      requests: new Map(),
      errors: new Map(),
      latencies: new Map(),
      activeRequests: 0,
      startTime: Date.now()
    };
  }
}
