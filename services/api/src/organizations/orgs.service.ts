import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto, CreateOrgUserDto, UpdateOrgUserDto } from './dto';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { SubscriptionStatus, UserRole } from '@prisma/client';

@Injectable()
export class OrgsService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapOrganization(dto: CreateOrgDto) {
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
        role: UserRole.ORG_ADMIN,
      },
    });

    await this.prisma.subscription.create({
      data: {
        organizationId: organization.id,
        plan: dto.plan ?? 'basic',
        unitCount: 0,
        stripeSubscriptionId: null,
        status: SubscriptionStatus.ACTIVE,
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

  async getCurrentOrg(currentUser: CurrentUser) {
    const org = await this.prisma.organization.findUnique({
      where: { id: currentUser.orgId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async createUserInOrg(currentUser: CurrentUser, dto: CreateOrgUserDto) {
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

  listUsers(currentUser: CurrentUser) {
    return this.prisma.user.findMany({
      where: { organizationId: currentUser.orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateUser(currentUser: CurrentUser, userId: string, dto: UpdateOrgUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id: userId, organizationId: currentUser.orgId },
    });

    if (!existing) {
      throw new NotFoundException('User not found in organization');
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
}
