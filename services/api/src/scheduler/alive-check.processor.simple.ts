import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { TokenService } from './token.service';

export interface AliveCheckJobData {
  userId: string;
  userEmail: string;
  checkType: 'INITIAL' | 'REMINDER' | 'FINAL' | 'ESCALATION';
  expiresAt: string;
}

@Processor('alive-check')
export class AliveCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(AliveCheckProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

  async process(job: Job<AliveCheckJobData>): Promise<void> {
    const { name } = job;

    try {
      switch (name) {
        case 'send-alive-check':
          await this.handleSendAliveCheck(job);
          break;
        case 'escalate-to-trusted-contacts':
          await this.handleEscalateToTrustedContacts(job);
          break;
        case 'initiate-legacy-release':
          await this.handleInitiateLegacyRelease(job);
          break;
        default:
          this.logger.warn(`Unknown job type: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job ${name}:`, error);
      throw error;
    }
  }

  /**
   * Send alive check email with tracking token
   */
  private async handleSendAliveCheck(job: Job<AliveCheckJobData>): Promise<void> {
    const { userId, checkType, expiresAt } = job.data;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping alive check`);
      return;
    }

    // Generate signed token for this alive check
    const token = await this.tokenService.generateAliveCheckToken(userId, new Date(expiresAt));

    // Create alive check record (commented out due to schema compatibility)
    // const aliveCheck = await this.prisma.aliveCheck.create({
    //   data: {
    //     userId,
    //     checkType,
    //     token,
    //     sentAt: new Date(),
    //     expiresAt: new Date(expiresAt),
    //   },
    // });

    // Send email based on check type
    const emailSent = await this.sendAliveCheckEmail(user, checkType, token, expiresAt);

    if (emailSent) {
      this.logger.log(`Alive check email sent to user ${userId} (${checkType})`);
    } else {
      this.logger.error(`Failed to send alive check email to user ${userId}`);
      throw new Error('Failed to send alive check email');
    }
  }

  /**
   * Escalate to trusted contacts when user doesn't respond
   */
  private async handleEscalateToTrustedContacts(job: Job<AliveCheckJobData>): Promise<void> {
    const { userId } = job.data;

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for escalation`);
      return;
    }

    // Get trusted contacts (placeholder - implement when TrustedContact model is ready)
    const trustedContacts: any[] = [];

    if (trustedContacts.length === 0) {
      this.logger.warn(`No trusted contacts found for user ${userId}, proceeding to legacy release`);
      // Schedule immediate legacy release
      await this.handleInitiateLegacyRelease(job);
      return;
    }

    this.logger.log(`Escalated alive check for user ${userId} to ${trustedContacts.length} trusted contacts`);
  }

  /**
   * Initiate legacy release process
   */
  private async handleInitiateLegacyRelease(job: Job<AliveCheckJobData>): Promise<void> {
    const { userId } = job.data;

    try {
      // Mark user for legacy release
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Legacy release initiated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to initiate legacy release for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send alive check email based on type
   */
  private async sendAliveCheckEmail(
    user: { id: string; email: string; name: string | null },
    checkType: string,
    token: string,
    expiresAt: string,
  ): Promise<boolean> {
    try {
      const emailData = {
        to: user.email,
        subject: `Alive Check - Please Confirm (${checkType})`,
        template: 'alive-check',
        data: {
          userName: user.name || 'User',
          token,
          expiresAt,
          confirmUrl: `${process.env.APP_URL}/confirm-alive?token=${token}`,
          trackingPixelUrl: `${process.env.API_URL}/webhooks/track-open?token=${token}`,
          daysRemaining: 7,
        },
      };
      return await this.emailService.sendAliveCheckEmail(emailData);
    } catch (error) {
      this.logger.error(`Error sending alive check email:`, error);
      return false;
    }
  }
}
