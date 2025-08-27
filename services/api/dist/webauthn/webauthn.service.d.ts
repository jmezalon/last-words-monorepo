import { PrismaService } from '../prisma/prisma.service';
export declare class WebAuthnService {
    private prisma;
    private readonly rpName;
    private readonly rpID;
    private readonly origin;
    constructor(prisma: PrismaService);
    generateRegistrationOptions(userId: string): unknown;
    verifyRegistration(userId: string, response: any, expectedChallenge: string): unknown;
    generateAuthenticationOptions(userId?: string): unknown;
    verifyAuthentication(response: any, expectedChallenge: string, userId?: string): unknown;
}
