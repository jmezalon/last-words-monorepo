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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const crypto_service_1 = require("../services/crypto.service");
let CryptoController = class CryptoController {
    constructor(cryptoService) {
        this.cryptoService = cryptoService;
    }
    async generateCIK() {
        const cik = await this.cryptoService.generateCIK();
        return {
            cik: cik.toString('base64'),
            timestamp: new Date().toISOString()
        };
    }
    async getMasterKey(req) {
        const userId = req.user?.sub;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        const masterKey = await this.cryptoService.getUserMasterKey(userId);
        return {
            masterKey: Buffer.from(masterKey).toString('base64')
        };
    }
    async uploadSecret(req, secretData) {
        const userId = req.user?.sub;
        if (!userId) {
            throw new Error('User ID not found in request');
        }
        const secretId = await this.cryptoService.storeEncryptedSecret(userId, {
            encryptedCIK: secretData.encryptedCIK,
            ciphertext: secretData.ciphertext,
            nonce: secretData.nonce,
            title: secretData.title,
            description: secretData.description,
            category: secretData.category,
            tags: secretData.tags
        });
        return {
            secretId,
            success: true
        };
    }
};
exports.CryptoController = CryptoController;
__decorate([
    (0, common_1.Post)('generate-cik'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "generateCIK", null);
__decorate([
    (0, common_1.Post)('get-master-key'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "getMasterKey", null);
__decorate([
    (0, common_1.Post)('upload-secret'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CryptoController.prototype, "uploadSecret", null);
exports.CryptoController = CryptoController = __decorate([
    (0, common_1.Controller)('crypto'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [crypto_service_1.CryptoService])
], CryptoController);
//# sourceMappingURL=crypto.controller.js.map