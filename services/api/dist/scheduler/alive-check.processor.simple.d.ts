import { WorkerHost } from '@nestjs/bullmq';
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
export declare class AliveCheckProcessor extends WorkerHost {
    private readonly prisma;
    private readonly emailService;
    private readonly tokenService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService, tokenService: TokenService);
    process(job: Job<AliveCheckJobData>): Promise<void>;
    private handleSendAliveCheck;
    private handleEscalateToTrustedContacts;
    private handleInitiateLegacyRelease;
    private sendAliveCheckEmail;
}
