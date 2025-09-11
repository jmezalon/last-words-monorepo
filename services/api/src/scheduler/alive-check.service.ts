import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingUserRepository } from '../repositories/working-user.repository';
import { TokenService } from './token.service';

export interface AliveCheckJobData {
  userId: string;
  userEmail: string;
  checkType: 'initial' | 'reminder' | 'final' | 'escalation';
  attemptNumber: number;
  scheduledAt: Date;
  expiresAt: Date;
}

@Injectable()
export class AliveCheckService {
  private readonly logger = new Logger(AliveCheckService.name);

  constructor(
    @InjectQueue('alive-check') private aliveCheckQueue: Queue,
    private prisma: PrismaService,
    private userRepository: WorkingUserRepository,
    private tokenService: TokenService,
  ) {}

  /**
   * Schedule initial alive check for a user
   */
  async scheduleAliveCheck(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const now = new Date();
    const checkDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const expiresAt = new Date(checkDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days to respond

    const jobData: AliveCheckJobData = {
      userId,
      userEmail: user.email,
      checkType: 'initial',
      attemptNumber: 1,
      scheduledAt: checkDate,
      expiresAt,
    };

    await this.aliveCheckQueue.add(
      'send-alive-check',
      jobData,
      {
        delay: checkDate.getTime() - now.getTime(),
        jobId: `alive-check-${userId}-${checkDate.getTime()}`,
      }
    );

    this.logger.log(`Scheduled alive check for user ${userId} at ${checkDate.toISOString()}`);
  }

  /**
   * Schedule reminder for unresponded alive check
   */
  async scheduleReminder(userId: string, originalCheckDate: Date): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return;
    }

    const reminderDate = new Date(originalCheckDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after initial
    const expiresAt = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const jobData: AliveCheckJobData = {
      userId,
      userEmail: user.email,
      checkType: 'reminder',
      attemptNumber: 2,
      scheduledAt: reminderDate,
      expiresAt,
    };

    await this.aliveCheckQueue.add(
      'send-alive-check',
      jobData,
      {
        delay: Math.max(0, reminderDate.getTime() - Date.now()),
        jobId: `alive-reminder-${userId}-${reminderDate.getTime()}`,
      }
    );

    this.logger.log(`Scheduled reminder for user ${userId} at ${reminderDate.toISOString()}`);
  }

  /**
   * Schedule final notice before escalation
   */
  async scheduleFinalNotice(userId: string, originalCheckDate: Date): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return;
    }

    const finalDate = new Date(originalCheckDate.getTime() + 6 * 24 * 60 * 60 * 1000); // 6 days after initial
    const expiresAt = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const jobData: AliveCheckJobData = {
      userId,
      userEmail: user.email,
      checkType: 'final',
      attemptNumber: 3,
      scheduledAt: finalDate,
      expiresAt,
    };

    await this.aliveCheckQueue.add(
      'send-alive-check',
      jobData,
      {
        delay: Math.max(0, finalDate.getTime() - Date.now()),
        jobId: `alive-final-${userId}-${finalDate.getTime()}`,
      }
    );

    this.logger.log(`Scheduled final notice for user ${userId} at ${finalDate.toISOString()}`);
  }

  /**
   * Schedule escalation to trusted contacts
   */
  async scheduleEscalation(userId: string, originalCheckDate: Date): Promise<void> {
    const escalationDate = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days after initial

    const jobData: AliveCheckJobData = {
      userId,
      userEmail: '',
      checkType: 'escalation',
      attemptNumber: 4,
      scheduledAt: escalationDate,
      expiresAt: escalationDate,
    };

    await this.aliveCheckQueue.add(
      'escalate-to-contacts',
      jobData,
      {
        delay: Math.max(0, escalationDate.getTime() - Date.now()),
        jobId: `alive-escalation-${userId}-${escalationDate.getTime()}`,
      }
    );

    // await this.aliveCheckQueue.removeJobs(`alive-escalation-${userId}*`);

    this.logger.log(`Scheduled escalation for user ${userId} at ${escalationDate.toISOString()}`);
  }

  /**
   * Mark user as alive and cancel pending checks
   */
  async confirmAlive(token: string): Promise<boolean> {
    try {
      // Verify token and get check details
      const tokenData = await this.verifyAliveToken(token);
      if (!tokenData) {
        return false;
      }

      // Update user's last alive timestamp
      await this.prisma.user.update({
        where: { id: tokenData.userId },
        data: { 
          updatedAt: new Date(),
        },
      });

      // Cancel all pending alive check jobs for this user
      await this.cancelPendingChecks(tokenData.userId);

      // Schedule next alive check (30 days from now)
      // await this.aliveCheckQueue.removeJobs(`alive-check-${tokenData.userId}*`);

      this.logger.log(`User ${tokenData.userId} confirmed alive, cancelled pending checks`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to mark user as alive:`, error);
      return false;
    }
  }

  /**
   * Cancel all pending alive check jobs for a user
   */
  private async cancelPendingChecks(userId: string): Promise<void> {
    const jobs = await this.aliveCheckQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.userId === userId) {
        await job.remove();
        this.logger.log(`Cancelled job ${job.id} for user ${userId}`);
      }
    }
  }

  /**
   * Verify alive check token
   */
  private async verifyAliveToken(token: string): Promise<{ userId: string; checkId: string } | null> {
    // TODO: Implement token verification using TokenService
    // This should decode and verify the signed JWT token
    try {
      const decoded = await this.tokenService.verifyAliveCheckToken(token);
      return decoded;
    } catch (error) {
      this.logger.error('Failed to verify alive token:', error);
      return null;
    }
  }

  /**
   * Daily cron job to check for overdue alive checks
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkOverdueAliveChecks(): Promise<void> {
    this.logger.log('Running daily overdue alive checks scan');

    const overdueUsers = await this.prisma.user.findMany({
      where: {
        id: { not: null },
        updatedAt: {
          lt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        },
      },
    });

    for (const user of overdueUsers) {
      this.logger.warn(`User ${user.id} has overdue alive check, marking for release`);
      
      // Mark user for legacy release
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          updatedAt: new Date(),
          // legacyReleaseScheduled: true,
        },
      });

      // Schedule legacy release job
      await this.aliveCheckQueue.add(
        'initiate-legacy-release',
        { userId: user.id },
        { jobId: `legacy-release-${user.id}` }
      );
    }
  }
}
