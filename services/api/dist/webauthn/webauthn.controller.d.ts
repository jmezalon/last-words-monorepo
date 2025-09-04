import { WebAuthnService } from './webauthn.service';
export declare class WebAuthnController {
    private webAuthnService;
    constructor(webAuthnService: WebAuthnService);
    generateRegistrationOptions(user: any): Promise<import("@simplewebauthn/server/script/deps").PublicKeyCredentialCreationOptionsJSON>;
    verifyRegistration(user: any, body: {
        response: any;
        expectedChallenge: string;
    }): Promise<import("@simplewebauthn/server").VerifiedRegistrationResponse>;
    generateAuthenticationOptions(body: {
        userId?: string;
    }): Promise<import("@simplewebauthn/server/script/deps").PublicKeyCredentialRequestOptionsJSON>;
    verifyAuthentication(body: {
        response: any;
        expectedChallenge: string;
        userId?: string;
    }): Promise<{
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
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
}
