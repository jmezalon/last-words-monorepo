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
exports.WebAuthnController = void 0;
const common_1 = require("@nestjs/common");
const webauthn_service_1 = require("./webauthn.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const user_decorator_1 = require("../auth/user.decorator");
let WebAuthnController = class WebAuthnController {
    constructor(webAuthnService) {
        this.webAuthnService = webAuthnService;
    }
    async generateRegistrationOptions(user) {
        return this.webAuthnService.generateRegistrationOptions(user.id);
    }
    async verifyRegistration(user, body) {
        return this.webAuthnService.verifyRegistration(user.id, body.response, body.expectedChallenge);
    }
    async generateAuthenticationOptions(body) {
        return this.webAuthnService.generateAuthenticationOptions(body.userId);
    }
    async verifyAuthentication(body) {
        return this.webAuthnService.verifyAuthentication(body.response, body.expectedChallenge, body.userId);
    }
};
exports.WebAuthnController = WebAuthnController;
__decorate([
    (0, common_1.Post)('registration/generate-options'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebAuthnController.prototype, "generateRegistrationOptions", null);
__decorate([
    (0, common_1.Post)('registration/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebAuthnController.prototype, "verifyRegistration", null);
__decorate([
    (0, common_1.Post)('authentication/generate-options'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebAuthnController.prototype, "generateAuthenticationOptions", null);
__decorate([
    (0, common_1.Post)('authentication/verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebAuthnController.prototype, "verifyAuthentication", null);
exports.WebAuthnController = WebAuthnController = __decorate([
    (0, common_1.Controller)('webauthn'),
    __metadata("design:paramtypes", [webauthn_service_1.WebAuthnService])
], WebAuthnController);
//# sourceMappingURL=webauthn.controller.js.map