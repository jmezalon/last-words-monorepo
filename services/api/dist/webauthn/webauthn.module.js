"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebAuthnModule = void 0;
const common_1 = require("@nestjs/common");
const webauthn_controller_1 = require("./webauthn.controller");
const webauthn_service_1 = require("./webauthn.service");
const prisma_service_1 = require("../prisma/prisma.service");
let WebAuthnModule = class WebAuthnModule {
};
exports.WebAuthnModule = WebAuthnModule;
exports.WebAuthnModule = WebAuthnModule = __decorate([
    (0, common_1.Module)({
        controllers: [webauthn_controller_1.WebAuthnController],
        providers: [webauthn_service_1.WebAuthnService, prisma_service_1.PrismaService],
        exports: [webauthn_service_1.WebAuthnService],
    })
], WebAuthnModule);
//# sourceMappingURL=webauthn.module.js.map