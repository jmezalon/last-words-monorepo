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
const email_service_1 = require("./email.service");
const token_service_1 = require("./token.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AliveCheckProcessor = AliveCheckProcessor_1 = class AliveCheckProcessor extends bullmq_1.WorkerHost {
    constructor(emailService, tokenService, prisma) {
        super();
        this.emailService = emailService;
        this.tokenService = tokenService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AliveCheckProcessor_1.name);
    }
    async process(job) {
        const { name, data } = job;
        this.logger.log(`Processing job ${name} for user ${data.userId}`);
        try {
            switch (name) {
                case 'send-alive-check':
                    await this.handleSendAliveCheck(job);
                    break;
                case 'escalate-to-contacts':
                    await this.handleEscalateToContacts(job);
                    break;
                case 'initiate-legacy-release':
                    await this.handleInitiateLegacyRelease(job);
                    break;
                default:
                    this.logger.warn(`Unknown job type: ${name}`);
            }
        }
        catch (error) {
            this.logger.error(`Job ${job.id} failed:`, error);
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
        const recentCheck = await this.prisma.aliveCheck.findFirst({
            where: {
                userId,
                status: 'CONFIRMED',
                confirmedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
        });
        if (recentCheck) {
            this.logger.log(`User ${userId} already confirmed alive recently, skipping check`);
            return;
        }
        const token = await this.tokenService.generateAliveCheckToken(userId, expiresAt);
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
            await this.prisma.user.update({
                where: { id: userId },
                data: { aliveCheckStatus: 'PENDING' },
            });
            await this.scheduleNextStep(userId, checkType, job.data.scheduledAt);
            this.logger.log(`Alive check email sent to ${userEmail} (${checkType})`);
        }
        else {
            throw new Error(`Failed to send alive check email to ${userEmail}`);
        }
    }
    async sendAliveCheckEmail(user, checkType, token, expiresAt) {
        const confirmUrl = `${process.env.APP_URL}/confirm-alive?token=${token}`;
        const trackingPixelUrl = `${process.env.API_URL}/webhook/email-open?token=${token}`;
        const templates = {
            initial: {
                subject: 'Digital Legacy - Confirm You\'re Active',
                template: 'alive-check-initial',
            },
            reminder: {
                subject: 'Reminder: Digital Legacy - Confirm You\'re Active',
                template: 'alive-check-reminder',
            },
            final: {
                subject: 'URGENT: Final Notice - Digital Legacy Activation',
                template: 'alive-check-final',
            },
        };
        const config = templates[checkType];
        if (!config) {
            throw new Error(`Unknown check type: ${checkType}`);
        }
        return await this.emailService.sendAliveCheckEmail({
            to: user.email,
            subject: config.subject,
            template: config.template,
            data: {
                userName: user.name || 'User',
                confirmUrl,
                trackingPixelUrl,
                expiresAt: expiresAt.toLocaleDateString(),
                daysRemaining: Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
            },
        });
    }
    async scheduleNextStep(userId, currentType, originalCheckDate) {
        const { AliveCheckService } = await Promise.resolve().then(() => require('./alive-check.service'));
        switch (currentType) {
            case 'initial':
                setTimeout(async () => {
                    const user = await this.prisma.user.findUnique({
                        where: { id: userId },
                        select: { aliveCheckStatus: true },
                    });
                    if (user?.aliveCheckStatus === 'PENDING') {
                    }
                }, 3 * 24 * 60 * 60 * 1000);
                break;
            case 'reminder':
                break;
            case 'final':
                break;
        }
    }
    async handleEscalateToContacts(job) {
        const { userId } = job.data;
        const trustedContacts = await this.prisma.trustedContact.findMany({
            where: {
                userId,
                isActive: true,
            },
        });
        if (trustedContacts.length === 0) {
            this.logger.warn(`No trusted contacts found for user ${userId}, proceeding to legacy release`);
            await this.markForLegacyRelease(userId);
            return;
        }
        for (const contact of trustedContacts) {
            await this.emailService.sendTrustedContactNotification({
                to: contact.email,
                subject: 'Digital Legacy - User Unresponsive',
                data: {
                    contactName: contact.name,
                    userEmail: contact.userEmail || 'the user',
                    escalationDate: new Date().toLocaleDateString(),
                },
            });
        }
        await this.markForLegacyRelease(userId);
        this.logger.log(`Escalated to ${trustedContacts.length} trusted contacts for user ${userId}`);
    }
    async handleInitiateLegacyRelease(job) {
        const { userId } = job.data;
        await this.markForLegacyRelease(userId);
        this.logger.log(`Legacy release initiated for user ${userId}`);
    }
    async markForLegacyRelease(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                aliveCheckStatus: 'OVERDUE',
                legacyReleaseScheduled: true,
                legacyReleaseDate: new Date(),
            },
        });
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'LEGACY_RELEASE_SCHEDULED',
                details: 'User failed to respond to alive checks, legacy release scheduled',
                timestamp: new Date(),
            },
        });
    }
};
exports.AliveCheckProcessor = AliveCheckProcessor;
exports.AliveCheckProcessor = AliveCheckProcessor = AliveCheckProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('alive-check'),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        token_service_1.TokenService,
        prisma_service_1.PrismaService])
], AliveCheckProcessor);
//# sourceMappingURL=alive-check.processor.js.map