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
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const working_secret_repository_1 = require("../repositories/working-secret.repository");
const working_user_repository_1 = require("../repositories/working-user.repository");
const crypto = require("crypto");
let CryptoService = class CryptoService {
    constructor(prisma, secretRepository, userRepository) {
        this.prisma = prisma;
        this.secretRepository = secretRepository;
        this.userRepository = userRepository;
    }
    async generateCIK() {
        return crypto.randomBytes(32);
    }
    async generateRandomKey(length) {
        return new Uint8Array(crypto.randomBytes(length));
    }
    async getUserMasterKey(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        }
        if (!user.masterKeyWrapped) {
            const masterKey = await this.generateRandomKey(32);
            await this.userRepository.update(userId, {
                masterKeyWrapped: Buffer.from(masterKey).toString('base64')
            });
            return masterKey;
        }
        return new Uint8Array(Buffer.from(user.masterKeyWrapped, 'base64'));
    }
    async storeEncryptedSecret(userId, secretData) {
        const will = await this.getOrCreateUserWill(userId);
        const secret = await this.secretRepository.create({
            willId: will.id,
            encryptedTitle: secretData.title,
            encryptedDescription: secretData.description,
            encryptedContent: secretData.ciphertext,
            encryptedMetadata: JSON.stringify({
                encryptedCIK: secretData.encryptedCIK,
                nonce: secretData.nonce
            }),
            category: secretData.category,
            tags: secretData.tags || [],
            secretType: 'encrypted_data'
        });
        return secret;
    }
    async getOrCreateUserWill(userId) {
        const existingWill = await this.prisma.will.findFirst({
            where: {
                userId,
                isActive: true
            }
        });
        if (existingWill) {
            return existingWill;
        }
        const will = await this.prisma.will.create({
            data: {
                userId,
                encryptedTitle: 'My Digital Legacy',
                encryptedDescription: 'Secure storage for my digital secrets',
                encryptedContent: '',
                releaseConditions: {},
                status: 'DRAFT'
            }
        });
        return will;
    }
    async getEncryptedSecret(secretId, userId) {
        const secret = await this.prisma.secret.findFirst({
            where: {
                id: secretId,
                will: {
                    userId
                }
            },
            include: {
                will: true
            }
        });
        if (!secret) {
            throw new common_1.HttpException('Secret not found', common_1.HttpStatus.NOT_FOUND);
        }
        const metadata = JSON.parse(secret.encryptedMetadata || '{}');
        return {
            id: secret.id,
            encryptedCIK: metadata.encryptedCIK,
            ciphertext: secret.encryptedContent,
            nonce: metadata.nonce,
            title: secret.encryptedTitle,
            description: secret.encryptedDescription,
            category: secret.category,
            tags: secret.tags
        };
    }
};
exports.CryptoService = CryptoService;
exports.CryptoService = CryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        working_secret_repository_1.WorkingSecretRepository,
        working_user_repository_1.WorkingUserRepository])
], CryptoService);
//# sourceMappingURL=crypto.service.js.map