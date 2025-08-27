import { PrismaService } from '../prisma/prisma.service';
declare const JwtStrategy_base: any;
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(prisma: PrismaService);
    validate(payload: any): unknown;
}
export {};
