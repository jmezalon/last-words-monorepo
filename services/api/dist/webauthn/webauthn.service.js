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
exports.WebAuthnService = void 0;
const common_1 = require("@nestjs/common");
const server_1 = require("@simplewebauthn/server");
const prisma_service_1 = require("../prisma/prisma.service");
let WebAuthnService = class WebAuthnService {
    constructor(prisma) {
        this.prisma = prisma;
        this.rpName = process.env.WEBAUTHN_RP_NAME || 'Last Words';
        this.rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
        this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
    }
    async generateRegistrationOptions(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { authenticators: true },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const opts = {
            rpName: this.rpName,
            rpID: this.rpID,
            userID: userId,
            userName: user.email,
            userDisplayName: user.name || user.email,
            timeout: 60000,
            attestationType: 'none',
            excludeCredentials: user.authenticators.map((authenticator) => ({
                id: Buffer.from(authenticator.credentialID, 'base64url'),
                type: 'public-key',
                transports: authenticator.transports?.split(','),
            })),
            authenticatorSelection: {
                residentKey: 'discouraged',
            },
            supportedAlgorithmIDs: [-7, -257],
        };
        return (0, server_1.generateRegistrationOptions)(opts);
    }
    async verifyRegistration(userId, response, expectedChallenge) {
        const opts = {
            response,
            expectedChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            requireUserVerification: true,
        };
        const verification = await (0, server_1.verifyRegistrationResponse)(opts);
        if (verification.verified && verification.registrationInfo) {
            const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
            await this.prisma.authenticator.create({
                data: {
                    credentialID: Buffer.from(credentialID).toString('base64url'),
                    userId,
                    providerAccountId: Buffer.from(credentialID).toString('base64url'),
                    credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
                    counter,
                    credentialDeviceType: 'singleDevice',
                    credentialBackedUp: false,
                    transports: response.response.transports?.join(','),
                },
            });
        }
        return verification;
    }
    async generateAuthenticationOptions(userId) {
        let allowCredentials;
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { authenticators: true },
            });
            if (user) {
                allowCredentials = user.authenticators.map((authenticator) => ({
                    id: Buffer.from(authenticator.credentialID, 'base64url'),
                    type: 'public-key',
                    transports: authenticator.transports?.split(','),
                }));
            }
        }
        const opts = {
            timeout: 60000,
            allowCredentials,
            userVerification: 'required',
            rpID: this.rpID,
        };
        return (0, server_1.generateAuthenticationOptions)(opts);
    }
    async verifyAuthentication(response, expectedChallenge, userId) {
        const credentialID = Buffer.from(response.id, 'base64url').toString('base64url');
        const authenticator = await this.prisma.authenticator.findUnique({
            where: { credentialID },
            include: { user: true },
        });
        if (!authenticator) {
            throw new Error('Authenticator not found');
        }
        if (userId && authenticator.userId !== userId) {
            throw new Error('Authenticator does not belong to user');
        }
        const opts = {
            response,
            expectedChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
            authenticator: {
                credentialID: Buffer.from(authenticator.credentialID, 'base64url'),
                credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64url'),
                counter: authenticator.counter,
                transports: authenticator.transports?.split(','),
            },
            requireUserVerification: true,
        };
        const verification = await (0, server_1.verifyAuthenticationResponse)(opts);
        if (verification.verified) {
            await this.prisma.authenticator.update({
                where: { credentialID },
                data: { counter: verification.authenticationInfo.newCounter },
            });
        }
        return {
            verified: verification.verified,
            user: authenticator.user,
        };
    }
};
exports.WebAuthnService = WebAuthnService;
exports.WebAuthnService = WebAuthnService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebAuthnService);
//# sourceMappingURL=webauthn.service.js.map