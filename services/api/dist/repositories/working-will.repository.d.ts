import { Will } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface CreateWillData {
    userId: string;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    requiresWebAuthn?: boolean;
    accessLevel?: string;
    releaseConditions?: string;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
}
export interface UpdateWillData {
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    requiresWebAuthn?: boolean;
    accessLevel?: string;
    releaseConditions?: string;
    autoReleaseEnabled?: boolean;
    manualReleaseEnabled?: boolean;
    status?: string;
}
export declare class WorkingWillRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateWillData): Promise<Will>;
    findById(id: string, userId?: string): Promise<Will | null>;
    findByUserId(userId: string, skip?: number, take?: number): Promise<Will[]>;
    update(id: string, data: UpdateWillData, userId?: string): Promise<Will>;
    delete(id: string, userId?: string): Promise<Will>;
    findByStatus(status: string, userId?: string): Promise<Will[]>;
}
