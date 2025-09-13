import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

export interface AuditEntry {
  id?: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  operation: string;
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'error';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  errorCode?: string;
  errorMessage?: string;
  previousHash?: string;
  hash?: string;
}

@Injectable()
export class AuditChainService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a hash chain for audit entries to ensure integrity
   */
  private calculateHash(entry: AuditEntry, previousHash: string = ''): string {
    const data = {
      timestamp: entry.timestamp.toISOString(),
      userId: entry.userId,
      sessionId: entry.sessionId,
      operation: entry.operation,
      resource: entry.resource,
      action: entry.action,
      result: entry.result,
      details: entry.details,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      duration: entry.duration,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
      previousHash
    };

    const serialized = JSON.stringify(data, Object.keys(data).sort());
    return createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Gets the hash of the last audit entry for chain validation
   */
  private async getLastAuditHash(): Promise<string> {
    // Get the last audit entry to chain with
    const lastEntry = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });

    const lastHash = lastEntry?.hash || null;
    return lastHash;
  }

  /**
   * Appends an audit entry to the chain
   */
  async appendAuditEntry(entry: Omit<AuditEntry, 'id' | 'previousHash' | 'hash'>): Promise<AuditEntry> {
    const previousHash = await this.getLastAuditHash();
    const auditEntry: AuditEntry = {
      ...entry,
      previousHash,
      timestamp: entry.timestamp || new Date()
    };

    const hash = this.calculateHash(auditEntry, previousHash);

    const auditRecord = await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        sessionId: entry.sessionId,
        operation: entry.operation,
        resource: entry.resource,
        action: entry.action,
        result: entry.result,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        duration: entry.duration,
        errorCode: entry.errorCode,
        errorMessage: entry.errorMessage,
        previousHash,
        hash,
      },
    });

    return {
      ...auditEntry,
      id: auditRecord.id
    };
  }

  /**
   * Validates the integrity of the audit chain
   */
  async validateAuditChain(): Promise<{ isValid: boolean; errors: string[] }> {
    const entries = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const errors: string[] = [];
    let previousHash: string | null = null;

    for (const entry of entries) {
      // Validate hash chain
      if (entry.previousHash !== previousHash) {
        errors.push(
          `Chain break at entry ${entry.id}: expected previousHash ${previousHash}, got ${entry.previousHash}`
        );
      }

      // Validate entry hash
      const calculatedHash = this.calculateHash({
        id: entry.id,
        timestamp: entry.createdAt,
        userId: entry.userId,
        sessionId: entry.sessionId,
        operation: entry.operation,
        resource: entry.resource,
        action: entry.action,
        result: entry.result,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        duration: entry.duration,
        errorCode: entry.errorCode,
        errorMessage: entry.errorMessage,
        previousHash: entry.previousHash,
      });

      if (calculatedHash !== entry.hash) {
        errors.push(
          `Hash mismatch at entry ${entry.id}: expected ${calculatedHash}, got ${entry.hash}`
        );
      }

      previousHash = entry.hash;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets audit entries with pagination and filtering
   */
  async getAuditEntries(options: {
    userId?: string;
    operation?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { userId, operation, resource, startDate, endDate, page = 1, limit = 100 } = options;

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (operation) whereClause.operation = operation;
    if (resource) whereClause.resource = resource;
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    const [entries, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Gets audit statistics for monitoring
   */
  async getAuditStatistics(): Promise<{
    totalEntries: number;
    entriesByOperation: Record<string, number>;
    entriesByResult: Record<string, number>;
    recentActivity: { date: string; count: number }[];
    topUsers: { userId: string; count: number }[];
  }> {
    const totalEntries = await this.prisma.auditLog.count();

    // Group by operation
    const operationStats = await this.prisma.auditLog.groupBy({
      by: ['operation'],
      _count: { operation: true },
    });

    // Group by result
    const resultStats = await this.prisma.auditLog.groupBy({
      by: ['result'],
      _count: { result: true },
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await this.prisma.auditLog.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Top users by activity
    const topUsers = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        userId: { not: null },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    return {
      totalEntries,
      entriesByOperation: operationStats.reduce(
        (acc, stat) => ({ ...acc, [stat.operation]: stat._count.operation }),
        {}
      ),
      entriesByResult: resultStats.reduce(
        (acc, stat) => ({ ...acc, [stat.result]: stat._count.result }),
        {}
      ),
      recentActivity: recentActivity.map(activity => ({
        date: activity.createdAt.toISOString().split('T')[0],
        count: activity._count.createdAt,
      })),
      topUsers: topUsers.map(user => ({
        userId: user.userId!,
        count: user._count.userId,
      })),
    };
  }

  /**
   * Archives old audit entries for compliance
   */
  async archiveOldEntries(olderThanDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Emergency audit entry for critical security events
   */
  async emergencyAudit(entry: {
    operation: string;
    resource: string;
    action: string;
    details?: Record<string, any>;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
  }): Promise<void> {
    // This bypasses normal validation for critical security events
    await this.appendAuditEntry({
      ...entry,
      timestamp: new Date(),
      result: 'error'
    });
  }
}
