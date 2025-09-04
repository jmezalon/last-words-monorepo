import { Secret } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface CreateSecretData {
    willId: string;
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
    requiresWebAuthn?: boolean;
    accessLevel?: string;
}
export interface UpdateSecretData {
    encryptedTitle?: string;
    encryptedDescription?: string;
    encryptedContent?: string;
    secretType?: string;
    encryptedMetadata?: string;
    category?: string;
    tags?: string[];
    priority?: number;
    requiresWebAuthn?: boolean;
    accessLevel?: string;
}
export declare class WorkingSecretRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateSecretData): Promise<Secret>;
    findById(id: string, userId?: string): Promise<Secret | null>;
    findByWillId(willId: string, userId?: string): Promise<Secret[]>;
    update(id: string, data: UpdateSecretData, userId?: string): Promise<Secret>;
    delete(id: string, userId?: string): Promise<Secret>;
    findByCategory(category: string, userId?: string): Promise<Secret[]>;
    searchByTags(tags: string[], userId?: string): Promise<Secret[]>;
}
