import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AliveCheckService } from './alive-check.service';
import { AliveCheckProcessor } from './alive-check.processor';
import { EmailService } from './email.service';
import { TokenService } from './token.service';
import { WebhookController } from './webhook.controller';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingUserRepository } from '../repositories/working-user.repository';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'alive-check',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [
    AliveCheckService,
    AliveCheckProcessor,
    EmailService,
    TokenService,
    PrismaService,
    WorkingUserRepository,
  ],
  controllers: [WebhookController],
  exports: [AliveCheckService],
})
export class SchedulerModule {}
