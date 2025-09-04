"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const alive_check_service_1 = require("./alive-check.service");
const alive_check_processor_1 = require("./alive-check.processor");
const email_service_1 = require("./email.service");
const token_service_1 = require("./token.service");
const webhook_controller_1 = require("./webhook.controller");
const prisma_service_1 = require("../prisma/prisma.service");
const working_user_repository_1 = require("../repositories/working-user.repository");
let SchedulerModule = class SchedulerModule {
};
exports.SchedulerModule = SchedulerModule;
exports.SchedulerModule = SchedulerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRoot({
                connection: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'alive-check',
                defaultJobOptions: {
                    removeOnComplete: 100,
                    removeOnFail: 50,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
        ],
        providers: [
            alive_check_service_1.AliveCheckService,
            alive_check_processor_1.AliveCheckProcessor,
            email_service_1.EmailService,
            token_service_1.TokenService,
            prisma_service_1.PrismaService,
            working_user_repository_1.WorkingUserRepository,
        ],
        controllers: [webhook_controller_1.WebhookController],
        exports: [alive_check_service_1.AliveCheckService],
    })
], SchedulerModule);
//# sourceMappingURL=scheduler.module.js.map