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
exports.WorkingWillRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkingWillRepository = class WorkingWillRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.will.create({
            data: {
                userId: data.userId,
                encryptedTitle: data.encryptedTitle,
                encryptedDescription: data.encryptedDescription,
                encryptedContent: data.encryptedContent || '',
                requiresWebAuthn: data.requiresWebAuthn ?? true,
                accessLevel: data.accessLevel || 'PRIVATE',
                releaseConditions: data.releaseConditions || '{}',
                autoReleaseEnabled: data.autoReleaseEnabled ?? false,
                manualReleaseEnabled: data.manualReleaseEnabled ?? true,
            },
        });
    }
    async findById(id, userId) {
        const where = { id };
        if (userId) {
            where.userId = userId;
        }
        return this.prisma.will.findFirst({
            where,
            include: {
                secrets: true,
                willBeneficiaries: {
                    include: {
                        beneficiary: true,
                    },
                },
            },
        });
    }
    async findByUserId(userId, skip = 0, take = 10) {
        return this.prisma.will.findMany({
            where: { userId },
            skip,
            take,
            include: {
                secrets: true,
                willBeneficiaries: {
                    include: {
                        beneficiary: true,
                    },
                },
            },
        });
    }
    async update(id, data, userId) {
        const where = { id };
        if (userId) {
            where.userId = userId;
        }
        return this.prisma.will.update({
            where,
            data,
        });
    }
    async delete(id, userId) {
        const where = { id };
        if (userId) {
            where.userId = userId;
        }
        return this.prisma.will.delete({
            where,
        });
    }
    async findByStatus(status, userId) {
        const where = { status };
        if (userId) {
            where.userId = userId;
        }
        return this.prisma.will.findMany({
            where,
            include: {
                secrets: true,
                willBeneficiaries: {
                    include: {
                        beneficiary: true,
                    },
                },
            },
        });
    }
};
exports.WorkingWillRepository = WorkingWillRepository;
exports.WorkingWillRepository = WorkingWillRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkingWillRepository);
//# sourceMappingURL=working-will.repository.js.map