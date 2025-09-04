import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AliveCheckJobData } from './alive-check.service';
import { EmailService } from './email.service';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AliveCheckProcessor extends WorkerHost {
    private emailService;
    private tokenService;
    private prisma;
    private readonly logger;
    constructor(emailService: EmailService, tokenService: TokenService, prisma: PrismaService);
    process(job: Job<AliveCheckJobData>): Promise<void>;
    private handleSendAliveCheck;
    private sendAliveCheckEmail;
    private scheduleNextStep;
    private handleEscalateToContacts;
    private handleInitiateLegacyRelease;
    private markForLegacyRelease;
}
