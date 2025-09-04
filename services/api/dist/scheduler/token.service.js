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
var TokenService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
let TokenService = TokenService_1 = class TokenService {
    constructor() {
        this.logger = new common_1.Logger(TokenService_1.name);
        this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    }
    async generateAliveCheckToken(userId, expiresAt) {
        const checkId = crypto.randomUUID();
        const now = Date.now();
        const payload = {
            userId,
            checkId,
            type: 'alive-check',
            issuedAt: now,
            expiresAt: expiresAt.getTime(),
        };
        const token = jwt.sign(payload, this.secret, {
            algorithm: 'HS256',
            expiresIn: Math.floor((expiresAt.getTime() - now) / 1000),
        });
        this.logger.log(`Generated alive check token for user ${userId}, expires at ${expiresAt.toISOString()}`);
        return token;
    }
    async verifyAliveCheckToken(token) {
        try {
            const decoded = jwt.verify(token, this.secret);
            if (decoded.type !== 'alive-check') {
                this.logger.warn(`Invalid token type: ${decoded.type}`);
                return null;
            }
            if (decoded.expiresAt < Date.now()) {
                this.logger.warn(`Token expired for user ${decoded.userId}`);
                return null;
            }
            return decoded;
        }
        catch (error) {
            this.logger.error('Token verification failed:', error);
            return null;
        }
    }
    async generateTrackingToken(userId, checkId, type) {
        const payload = {
            userId,
            checkId,
            type: `email-${type}`,
            timestamp: Date.now(),
        };
        return jwt.sign(payload, this.secret, {
            algorithm: 'HS256',
            expiresIn: '30d',
        });
    }
    async verifyTrackingToken(token) {
        try {
            return jwt.verify(token, this.secret);
        }
        catch (error) {
            this.logger.error('Tracking token verification failed:', error);
            return null;
        }
    }
    generateIdempotencyKey(userId, action, timestamp) {
        const date = timestamp || new Date();
        const dateStr = date.toISOString().split('T')[0];
        const data = `${userId}:${action}:${dateStr}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    createConfirmationUrl(token, baseUrl) {
        const base = baseUrl || process.env.APP_URL || 'http://localhost:3000';
        return `${base}/confirm-alive?token=${encodeURIComponent(token)}`;
    }
    createTrackingPixelUrl(token, baseUrl) {
        const base = baseUrl || process.env.API_URL || 'http://localhost:3001';
        return `${base}/webhook/email-open?token=${encodeURIComponent(token)}`;
    }
};
exports.TokenService = TokenService;
exports.TokenService = TokenService = TokenService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TokenService);
//# sourceMappingURL=token.service.js.map