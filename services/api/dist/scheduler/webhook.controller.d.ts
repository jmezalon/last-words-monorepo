import { Response } from 'express';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebhookController {
    private tokenService;
    private prisma;
    private readonly logger;
    constructor(tokenService: TokenService, prisma: PrismaService);
    trackEmailOpen(token: string, res: Response): Promise<void>;
    trackEmailClick(token: string, targetUrl: string, res: Response): Promise<void>;
    confirmAlive(token: string, res: Response): Promise<void>;
    handleEmailEvents(events: any[]): Promise<{
        status: string;
    }>;
    private processEmailEvent;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    private getClientIp;
}
