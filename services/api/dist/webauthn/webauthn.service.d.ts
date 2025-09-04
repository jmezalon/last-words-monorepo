import { PrismaService } from '../prisma/prisma.service';
export declare class WebAuthnService {
    private prisma;
    private readonly rpName;
    private readonly rpID;
    private readonly origin;
    constructor(prisma: PrismaService);
    generateRegistrationOptions(userId: string): Promise<import("@simplewebauthn/server/script/deps").PublicKeyCredentialCreationOptionsJSON>;
    verifyRegistration(userId: string, response: any, expectedChallenge: string): Promise<import("@simplewebauthn/server").VerifiedRegistrationResponse>;
    generateAuthenticationOptions(userId?: string): Promise<import("@simplewebauthn/server/script/deps").PublicKeyCredentialRequestOptionsJSON>;
    verifyAuthentication(response: any, expectedChallenge: string, userId?: string): Promise<{
        verified: boolean;
        user: {
            id: string;
            email: string;
            emailHmac: string;
            name: string | null;
            emailVerified: Date | null;
            image: string | null;
            encryptedPersonalData: string | null;
            masterKeyWrapped: string | null;
            keyDerivationSalt: string | null;
            timezone: string;
            notificationSettings: import("@prisma/client/runtime/library").JsonValue | null;
            lastAliveCheck: Date | null;
            aliveCheckStatus: string;
            legacyReleaseScheduled: boolean;
            legacyReleaseDate: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
