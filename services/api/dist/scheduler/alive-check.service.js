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
var AliveCheckService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliveCheckService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const working_user_repository_1 = require("../repositories/working-user.repository");
let AliveCheckService = AliveCheckService_1 = class AliveCheckService {
    constructor(aliveCheckQueue, prisma, userRepository) {
        this.aliveCheckQueue = aliveCheckQueue;
        this.prisma = prisma;
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(AliveCheckService_1.name);
    }
    async scheduleAliveCheck(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }
        const now = new Date();
        const checkDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiresAt = new Date(checkDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const jobData = {
            userId,
            userEmail: user.email,
            checkType: 'initial',
            attemptNumber: 1,
            scheduledAt: checkDate,
            expiresAt,
        };
        await this.aliveCheckQueue.add('send-alive-check', jobData, {
            delay: checkDate.getTime() - now.getTime(),
            jobId: `alive-check-${userId}-${checkDate.getTime()}`,
        });
        this.logger.log(`Scheduled alive check for user ${userId} at ${checkDate.toISOString()}`);
    }
    async scheduleReminder(userId, originalCheckDate) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return;
        }
        const reminderDate = new Date(originalCheckDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const expiresAt = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const jobData = {
            userId,
            userEmail: user.email,
            checkType: 'reminder',
            attemptNumber: 2,
            scheduledAt: reminderDate,
            expiresAt,
        };
        await this.aliveCheckQueue.add('send-alive-check', jobData, {
            delay: Math.max(0, reminderDate.getTime() - Date.now()),
            jobId: `alive-reminder-${userId}-${reminderDate.getTime()}`,
        });
        this.logger.log(`Scheduled reminder for user ${userId} at ${reminderDate.toISOString()}`);
    }
    async scheduleFinalNotice(userId, originalCheckDate) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return;
        }
        const finalDate = new Date(originalCheckDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        const expiresAt = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const jobData = {
            userId,
            userEmail: user.email,
            checkType: 'final',
            attemptNumber: 3,
            scheduledAt: finalDate,
            expiresAt,
        };
        await this.aliveCheckQueue.add('send-alive-check', jobData, {
            delay: Math.max(0, finalDate.getTime() - Date.now()),
            jobId: `alive-final-${userId}-${finalDate.getTime()}`,
        });
        this.logger.log(`Scheduled final notice for user ${userId} at ${finalDate.toISOString()}`);
    }
    async scheduleEscalation(userId, originalCheckDate) {
        const escalationDate = new Date(originalCheckDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const jobData = {
            userId,
            userEmail: '',
            checkType: 'escalation',
            attemptNumber: 4,
            scheduledAt: escalationDate,
            expiresAt: escalationDate,
        };
        await this.aliveCheckQueue.add('escalate-to-contacts', jobData, {
            delay: Math.max(0, escalationDate.getTime() - Date.now()),
            jobId: `alive-escalation-${userId}-${escalationDate.getTime()}`,
        });
        this.logger.log(`Scheduled escalation for user ${userId} at ${escalationDate.toISOString()}`);
    }
    async markUserAlive(userId, token) {
        try {
            const tokenData = await this.verifyAliveToken(token);
            if (!tokenData || tokenData.userId !== userId) {
                return false;
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    lastAliveCheck: new Date(),
                    aliveCheckStatus: 'CONFIRMED',
                },
            });
            await this.cancelPendingChecks(userId);
            await this.scheduleAliveCheck(userId);
            this.logger.log(`User ${userId} marked as alive, next check scheduled`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to mark user ${userId} as alive:`, error);
            return false;
        }
    }
    async cancelPendingChecks(userId) {
        const jobs = await this.aliveCheckQueue.getJobs(['waiting', 'delayed']);
        for (const job of jobs) {
            if (job.data.userId === userId) {
                await job.remove();
                this.logger.log(`Cancelled job ${job.id} for user ${userId}`);
            }
        }
    }
    async verifyAliveToken(token) {
        return null;
    }
    async checkOverdueAliveChecks() {
        this.logger.log('Running daily overdue alive checks scan');
        const overdueUsers = await this.prisma.user.findMany({
            where: {
                aliveCheckStatus: 'PENDING',
                lastAliveCheck: {
                    lt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                },
            },
        });
        for (const user of overdueUsers) {
            this.logger.warn(`User ${user.id} has overdue alive check, marking for release`);
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    aliveCheckStatus: 'OVERDUE',
                    legacyReleaseScheduled: true,
                },
            });
            await this.aliveCheckQueue.add('initiate-legacy-release', { userId: user.id }, { jobId: `legacy-release-${user.id}` });
        }
    }
};
exports.AliveCheckService = AliveCheckService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AliveCheckService.prototype, "checkOverdueAliveChecks", null);
exports.AliveCheckService = AliveCheckService = AliveCheckService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('alive-check')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService,
        working_user_repository_1.WorkingUserRepository])
], AliveCheckService);
//# sourceMappingURL=alive-check.service.js.map