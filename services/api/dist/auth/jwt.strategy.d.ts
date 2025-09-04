import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): Promise<{
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
    }>;
}
export {};
