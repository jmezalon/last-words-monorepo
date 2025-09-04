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
exports.WorkingUserRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/utils/crypto.util");
let WorkingUserRepository = class WorkingUserRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const { hmac: emailHmac } = crypto_util_1.CryptoUtil.generateEmailHmac(data.email);
        return this.prisma.user.create({
            data: {
                email: data.email,
                name: data.name,
                emailHmac,
                encryptedPersonalData: data.encryptedPersonalData,
                masterKeyWrapped: data.masterKeyWrapped,
                keyDerivationSalt: data.keyDerivationSalt,
                timezone: data.timezone || 'UTC',
            },
        });
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findByEmailHmac(emailHmac) {
        return this.prisma.user.findFirst({
            where: { emailHmac },
        });
    }
    async update(id, data) {
        const updateData = { ...data };
        if (data.email) {
            const { hmac: emailHmac } = crypto_util_1.CryptoUtil.generateEmailHmac(data.email);
            updateData.emailHmac = emailHmac;
        }
        return this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async delete(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
    async findMany(skip = 0, take = 10) {
        return this.prisma.user.findMany({
            skip,
            take,
        });
    }
};
exports.WorkingUserRepository = WorkingUserRepository;
exports.WorkingUserRepository = WorkingUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkingUserRepository);
//# sourceMappingURL=working-user.repository.js.map