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
exports.OrgsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OrgsService = class OrgsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async bootstrapOrganization(dto) {
        const organization = await this.prisma.organization.create({
            data: {
                type: dto.type,
                name: dto.name,
                plan: dto.plan ?? 'basic',
            },
        });
        const adminUser = await this.prisma.user.create({
            data: {
                organizationId: organization.id,
                email: dto.adminEmail,
                name: dto.adminName ?? dto.adminEmail,
                role: client_1.UserRole.ORG_ADMIN,
            },
        });
        await this.prisma.subscription.create({
            data: {
                organizationId: organization.id,
                plan: dto.plan ?? 'basic',
                unitCount: 0,
                stripeSubscriptionId: null,
                status: client_1.SubscriptionStatus.ACTIVE,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                organizationId: organization.id,
                userId: adminUser.id,
                action: 'ORG_CREATED',
                entityType: 'Organization',
                entityId: organization.id,
                metadataJson: {
                    name: organization.name,
                    adminEmail: adminUser.email,
                },
            },
        });
        return { organization, adminUser };
    }
    async getCurrentOrg(currentUser) {
        const org = await this.prisma.organization.findUnique({
            where: { id: currentUser.orgId },
        });
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        return org;
    }
    async createUserInOrg(currentUser, dto) {
        const user = await this.prisma.user.create({
            data: {
                organizationId: currentUser.orgId,
                email: dto.email,
                name: dto.name,
                role: dto.role,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                organizationId: currentUser.orgId,
                userId: currentUser.id,
                action: 'ORG_USER_CREATED',
                entityType: 'User',
                entityId: user.id,
                metadataJson: {
                    email: user.email,
                    role: user.role,
                },
            },
        });
        return user;
    }
    listUsers(currentUser) {
        return this.prisma.user.findMany({
            where: { organizationId: currentUser.orgId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async updateUser(currentUser, userId, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { id: userId, organizationId: currentUser.orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('User not found in organization');
        }
        const updated = await this.prisma.user.update({
            where: { id: existing.id },
            data: {
                role: dto.role ?? existing.role,
                status: dto.status ?? existing.status,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                organizationId: currentUser.orgId,
                userId: currentUser.id,
                action: 'ORG_USER_UPDATED',
                entityType: 'User',
                entityId: updated.id,
                metadataJson: {
                    before: { role: existing.role, status: existing.status },
                    after: { role: updated.role, status: updated.status },
                },
            },
        });
        return updated;
    }
};
exports.OrgsService = OrgsService;
exports.OrgsService = OrgsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrgsService);
//# sourceMappingURL=orgs.service.js.map