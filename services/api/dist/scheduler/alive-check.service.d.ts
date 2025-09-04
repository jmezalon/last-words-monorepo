import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WorkingUserRepository } from '../repositories/working-user.repository';
export interface AliveCheckJobData {
    userId: string;
    userEmail: string;
    checkType: 'initial' | 'reminder' | 'final' | 'escalation';
    attemptNumber: number;
    scheduledAt: Date;
    expiresAt: Date;
}
export declare class AliveCheckService {
    private aliveCheckQueue;
    private prisma;
    private userRepository;
    private readonly logger;
    constructor(aliveCheckQueue: Queue, prisma: PrismaService, userRepository: WorkingUserRepository);
    scheduleAliveCheck(userId: string): Promise<void>;
    scheduleReminder(userId: string, originalCheckDate: Date): Promise<void>;
    scheduleFinalNotice(userId: string, originalCheckDate: Date): Promise<void>;
    scheduleEscalation(userId: string, originalCheckDate: Date): Promise<void>;
    markUserAlive(userId: string, token: string): Promise<boolean>;
    private cancelPendingChecks;
    private verifyAliveToken;
    checkOverdueAliveChecks(): Promise<void>;
}
