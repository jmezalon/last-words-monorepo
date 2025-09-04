import { PrismaService } from '../prisma/prisma.service';
import { WorkingSecretRepository } from '../repositories/working-secret.repository';
import { WorkingUserRepository } from '../repositories/working-user.repository';
export interface EncryptedSecretData {
    encryptedCIK: string;
    ciphertext: string;
    nonce: string;
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
}
export declare class CryptoService {
    private prisma;
    private secretRepository;
    private userRepository;
    constructor(prisma: PrismaService, secretRepository: WorkingSecretRepository, userRepository: WorkingUserRepository);
    generateCIK(): Promise<Buffer>;
    generateRandomKey(length: number): Promise<Uint8Array>;
    getUserMasterKey(userId: string): Promise<Uint8Array>;
    storeEncryptedSecret(userId: string, secretData: EncryptedSecretData): Promise<{
        requiresWebAuthn: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        encryptedTitle: string;
        encryptedDescription: string | null;
        encryptedContent: string;
        accessLevel: string;
        isActive: boolean;
        willId: string;
        secretType: string;
        encryptedMetadata: string | null;
        category: string | null;
        tags: string[];
        priority: number;
    }>;
    private getOrCreateUserWill;
    getEncryptedSecret(secretId: string, userId: string): Promise<{
        id: string;
        encryptedCIK: any;
        ciphertext: string;
        nonce: any;
        title: string;
        description: string;
        category: string;
        tags: string[];
    }>;
}
