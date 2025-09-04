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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("./token.service");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(tokenService, prisma) {
        this.tokenService = tokenService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookController_1.name);
    }
    async trackEmailOpen(token, res) {
        try {
            const decoded = await this.tokenService.verifyTrackingToken(token);
            if (decoded && decoded.userId) {
                await this.prisma.emailTracking.create({
                    data: {
                        userId: decoded.userId,
                        checkId: decoded.checkId,
                        eventType: 'OPEN',
                        timestamp: new Date(),
                        userAgent: res.req.headers['user-agent'] || '',
                        ipAddress: this.getClientIp(res.req),
                    },
                });
                this.logger.log(`Email opened by user ${decoded.userId}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to track email open:', error);
        }
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
        res.set({
            'Content-Type': 'image/png',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });
        res.send(pixel);
    }
    async trackEmailClick(token, targetUrl, res) {
        try {
            const decoded = await this.tokenService.verifyTrackingToken(token);
            if (decoded && decoded.userId) {
                await this.prisma.emailTracking.create({
                    data: {
                        userId: decoded.userId,
                        checkId: decoded.checkId,
                        eventType: 'CLICK',
                        timestamp: new Date(),
                        userAgent: res.req.headers['user-agent'] || '',
                        ipAddress: this.getClientIp(res.req),
                        metadata: { targetUrl },
                    },
                });
                this.logger.log(`Email link clicked by user ${decoded.userId}, target: ${targetUrl}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to track email click:', error);
        }
        const redirectUrl = targetUrl || process.env.APP_URL || 'http://localhost:3000';
        res.redirect(302, redirectUrl);
    }
    async confirmAlive(token, res) {
        try {
            const decoded = await this.tokenService.verifyAliveCheckToken(token);
            if (!decoded) {
                return res.redirect(`${process.env.APP_URL}/confirm-alive?error=invalid_token`);
            }
            await this.prisma.user.update({
                where: { id: decoded.userId },
                data: {
                    lastAliveCheck: new Date(),
                    aliveCheckStatus: 'CONFIRMED',
                },
            });
            await this.prisma.aliveCheck.updateMany({
                where: {
                    userId: decoded.userId,
                    token,
                },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                },
            });
            await this.prisma.auditLog.create({
                data: {
                    userId: decoded.userId,
                    action: 'ALIVE_CHECK_CONFIRMED',
                    details: `User confirmed alive via email token`,
                    timestamp: new Date(),
                },
            });
            this.logger.log(`User ${decoded.userId} confirmed alive via email token`);
            res.redirect(`${process.env.APP_URL}/confirm-alive?success=true`);
        }
        catch (error) {
            this.logger.error('Failed to confirm alive:', error);
            res.redirect(`${process.env.APP_URL}/confirm-alive?error=server_error`);
        }
    }
    async handleEmailEvents(events) {
        try {
            for (const event of events) {
                await this.processEmailEvent(event);
            }
            return { status: 'success' };
        }
        catch (error) {
            this.logger.error('Failed to process email events:', error);
            return { status: 'error' };
        }
    }
    async processEmailEvent(event) {
        const { event: eventType, email, timestamp, ...metadata } = event;
        const userId = metadata['X-Last-Words-User-Id'] || metadata.userId;
        const checkId = metadata['X-Last-Words-Check-Id'] || metadata.checkId;
        if (!userId) {
            this.logger.warn('Email event missing user ID:', event);
            return;
        }
        const eventTypeMap = {
            'delivered': 'DELIVERED',
            'opened': 'OPEN',
            'clicked': 'CLICK',
            'bounced': 'BOUNCE',
            'dropped': 'DROP',
            'deferred': 'DEFER',
            'unsubscribed': 'UNSUBSCRIBE',
        };
        const internalEventType = eventTypeMap[eventType.toLowerCase()];
        if (!internalEventType) {
            this.logger.warn(`Unknown email event type: ${eventType}`);
            return;
        }
        await this.prisma.emailTracking.create({
            data: {
                userId,
                checkId,
                eventType: internalEventType,
                timestamp: new Date(timestamp * 1000),
                metadata: {
                    originalEvent: event,
                    provider: 'webhook',
                },
            },
        });
        this.logger.log(`Processed email event: ${eventType} for user ${userId}`);
    }
    async healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    getClientIp(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.ip ||
            'unknown';
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Get)('email-open'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "trackEmailOpen", null);
__decorate([
    (0, common_1.Get)('email-click'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Query)('url')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "trackEmailClick", null);
__decorate([
    (0, common_1.Get)('confirm-alive/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "confirmAlive", null);
__decorate([
    (0, common_1.Post)('email-events'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleEmailEvents", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "healthCheck", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        prisma_service_1.PrismaService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map