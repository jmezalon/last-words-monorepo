import { CryptoService } from '../services/crypto.service';
import { CreateSecretDto } from '../common/validators/zod-schemas';
export declare class CryptoController {
    private readonly cryptoService;
    constructor(cryptoService: CryptoService);
    generateCIK(): Promise<{
        cik: string;
        timestamp: string;
    }>;
    getMasterKey(req: any): Promise<{
        masterKey: string;
    }>;
    uploadSecret(req: any, secretData: CreateSecretDto): Promise<{
        secretId: {
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
        };
        success: boolean;
    }>;
}
