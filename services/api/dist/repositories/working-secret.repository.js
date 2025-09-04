"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkingSecretRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkingSecretRepository = class WorkingSecretRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.secret.create({
            data: {
                willId: data.willId,
                encryptedTitle: data.encryptedTitle,
                encryptedDescription: data.encryptedDescription,
                encryptedContent: data.encryptedContent || '',
                secretType: data.secretType,
                encryptedMetadata: data.encryptedMetadata,
                category: data.category,
                tags: data.tags,
                priority: data.priority ?? 1,
                requiresWebAuthn: data.requiresWebAuthn ?? true,
                accessLevel: data.accessLevel || 'PRIVATE',
            },
        });
    }
    async findById(id, userId) {
        const secret = await this.prisma.secret.findUnique({
            where: { id },
            include: {
                will: true,
            },
        });
        if (secret && userId && secret.will.userId !== userId) {
            return null;
        }
        return secret;
    }
    async findByWillId(willId, userId) {
        if (userId) {
            const will = await this.prisma.will.findFirst({
                where: { id: willId, userId },
            });
            if (!will)
                return [];
        }
        return this.prisma.secret.findMany({
            where: { willId },
            include: {
                will: true,
            },
        });
    }
    async update(id, data, userId) {
        if (userId) {
            const secret = await this.prisma.secret.findUnique({
                where: { id },
                include: { will: true },
            });
            if (!secret || secret.will.userId !== userId) {
                throw new Error('Secret not found or access denied');
            }
        }
        return this.prisma.secret.update({
            where: { id },
            data,
        });
    }
    async delete(id, userId) {
        if (userId) {
            const secret = await this.prisma.secret.findUnique({
                where: { id },
                include: { will: true },
            });
            if (!secret || secret.will.userId !== userId) {
                throw new Error('Secret not found or access denied');
            }
        }
        return this.prisma.secret.delete({
            where: { id },
        });
    }
    async findByCategory(category, userId) {
        const where = { category };
        if (userId) {
            where.will = { userId };
        }
        return this.prisma.secret.findMany({
            where,
            include: {
                will: true,
            },
        });
    }
    async searchByTags(tags, userId) {
        const where = {};
        if (userId) {
            where.will = { userId };
        }
        return this.prisma.secret.findMany({
            where,
            include: {
                will: true,
            },
        });
    }
};
exports.WorkingSecretRepository = WorkingSecretRepository;
exports.WorkingSecretRepository = WorkingSecretRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkingSecretRepository);
//# sourceMappingURL=working-secret.repository.js.map