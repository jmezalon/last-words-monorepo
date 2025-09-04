import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export interface CreateUserData {
    email: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}
export interface UpdateUserData {
    email?: string;
    name?: string;
    encryptedPersonalData?: string;
    masterKeyWrapped?: string;
    keyDerivationSalt?: string;
    timezone?: string;
}
export declare class WorkingUserRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: CreateUserData): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByEmailHmac(emailHmac: string): Promise<User | null>;
    update(id: string, data: UpdateUserData): Promise<User>;
    delete(id: string): Promise<User>;
    findMany(skip?: number, take?: number): Promise<User[]>;
}
