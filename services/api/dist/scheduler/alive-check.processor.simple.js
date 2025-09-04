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
var AliveCheckProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliveCheckProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("./email.service");
const token_service_1 = require("./token.service");
let AliveCheckProcessor = AliveCheckProcessor_1 = class AliveCheckProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, emailService, tokenService) {
        super();
        this.prisma = prisma;
        this.emailService = emailService;
        this.tokenService = tokenService;
        this.logger = new common_1.Logger(AliveCheckProcessor_1.name);
    }
    async process(job) {
        const { name, data } = job;
        try {
            switch (name) {
                case 'send-alive-check':
                    await this.handleSendAliveCheck(job);
                    break;
                case 'escalate-to-trusted-contacts':
                    await this.handleEscalateToTrustedContacts(job);
                    break;
                case 'initiate-legacy-release':
                    await this.handleInitiateLegacyRelease(job);
                    break;
                default:
                    this.logger.warn(`Unknown job type: ${name}`);
            }
        }
        catch (error) {
            this.logger.error(`Error processing job ${name}:`, error);
            throw error;
        }
    }
    async handleSendAliveCheck(job) {
        const { userId, userEmail, checkType, expiresAt } = job.data;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (!user) {
            this.logger.warn(`User ${userId} not found, skipping alive check`);
            return;
        }
        const token = await this.tokenService.generateAliveCheckToken(userId, new Date(expiresAt));
        const aliveCheck = await this.prisma.aliveCheck.create({
            data: {
                userId,
                checkType,
                token,
                sentAt: new Date(),
                expiresAt: new Date(expiresAt),
            },
        });
        const emailSent = await this.sendAliveCheckEmail(user, checkType, token, expiresAt);
        if (emailSent) {
            this.logger.log(`Alive check email sent to user ${userId} (${checkType})`);
        }
        else {
            this.logger.error(`Failed to send alive check email to user ${userId}`);
            throw new Error('Failed to send alive check email');
        }
    }
    async handleEscalateToTrustedContacts(job) {
        const { userId } = job.data;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        if (!user) {
            this.logger.warn(`User ${userId} not found for escalation`);
            return;
        }
        const trustedContacts = [];
        if (trustedContacts.length === 0) {
            this.logger.warn(`No trusted contacts found for user ${userId}, proceeding to legacy release`);
            await this.handleInitiateLegacyRelease(job);
            return;
        }
        this.logger.log(`Escalated alive check for user ${userId} to ${trustedContacts.length} trusted contacts`);
    }
    async handleInitiateLegacyRelease(job) {
        const { userId } = job.data;
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    updatedAt: new Date(),
                },
            });
            this.logger.log(`Legacy release initiated for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Failed to initiate legacy release for user ${userId}:`, error);
            throw error;
        }
    }
    async sendAliveCheckEmail(user, checkType, token, expiresAt) {
        try {
            const emailData = {
                to: user.email,
                subject: `Alive Check - Please Confirm (${checkType})`,
                template: 'alive-check',
                data: {
                    userName: user.name || 'User',
                    token,
                    expiresAt,
                    confirmUrl: `${process.env.APP_URL}/confirm-alive?token=${token}`,
                    trackingPixelUrl: `${process.env.API_URL}/webhooks/track-open?token=${token}`,
                    daysRemaining: 7,
                },
            };
            return await this.emailService.sendAliveCheckEmail(emailData);
        }
        catch (error) {
            this.logger.error(`Error sending alive check email:`, error);
            return false;
        }
    }
};
exports.AliveCheckProcessor = AliveCheckProcessor;
exports.AliveCheckProcessor = AliveCheckProcessor = AliveCheckProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('alive-check'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        token_service_1.TokenService])
], AliveCheckProcessor);
//# sourceMappingURL=alive-check.processor.simple.js.map