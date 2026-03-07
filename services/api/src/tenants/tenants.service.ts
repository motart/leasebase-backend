import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { UserRole } from '@prisma/client';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async list(user: CurrentUser) {
    // List all tenant-role users in the org, with their profiles
    return this.prisma.user.findMany({
      where: {
        organizationId: user.orgId,
        role: UserRole.TENANT,
      },
      include: {
        tenantProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(user: CurrentUser, id: string) {
    const tenant = await this.prisma.user.findFirst({
      where: {
        id,
        organizationId: user.orgId,
        role: UserRole.TENANT,
      },
      include: {
        tenantProfile: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async create(user: CurrentUser, dto: CreateTenantDto) {
    const fullName = `${dto.firstName} ${dto.lastName}`.trim();

    // Create user record with TENANT role
    const tenantUser = await this.prisma.user.create({
      data: {
        organizationId: user.orgId,
        email: dto.email,
        name: fullName,
        role: UserRole.TENANT,
      },
    });

    // Create tenant profile (without lease — can be added later)
    await this.prisma.tenantProfile.create({
      data: {
        userId: tenantUser.id,
        phone: dto.phone,
      },
    });

    // Create invitation if requested
    if (dto.sendInvitation && dto.email) {
      const invitation = await this.prisma.invitation.create({
        data: {
          organizationId: user.orgId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: UserRole.TENANT,
          propertyId: dto.propertyId,
          unitId: dto.unitId,
          invitedByUserId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      await this.sendInvitationEmail(invitation.email, invitation.token, fullName);
    }

    // Update onboarding progress
    await this.prisma.onboardingProgress.updateMany({
      where: {
        userId: user.id,
        tenantsInvited: false,
      },
      data: {
        tenantsInvited: true,
        currentStep: 'complete',
        completedAt: new Date(),
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId: user.orgId,
        userId: user.id,
        action: 'TENANT_CREATED',
        entityType: 'User',
        entityId: tenantUser.id,
        metadataJson: {
          email: dto.email,
          name: fullName,
          invited: !!dto.sendInvitation,
        },
      },
    });

    return this.prisma.user.findUnique({
      where: { id: tenantUser.id },
      include: { tenantProfile: true },
    });
  }

  async update(user: CurrentUser, id: string, dto: UpdateTenantDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id, organizationId: user.orgId, role: UserRole.TENANT },
    });
    if (!existing) {
      throw new NotFoundException('Tenant not found');
    }

    const updates: Record<string, any> = {};
    if (dto.firstName || dto.lastName) {
      const firstName = dto.firstName ?? existing.name.split(' ')[0];
      const lastName = dto.lastName ?? existing.name.split(' ').slice(1).join(' ');
      updates.name = `${firstName} ${lastName}`.trim();
    }

    if (Object.keys(updates).length > 0) {
      await this.prisma.user.update({ where: { id }, data: updates });
    }

    if (dto.phone !== undefined) {
      await this.prisma.tenantProfile.updateMany({
        where: { userId: id },
        data: { phone: dto.phone },
      });
    }

    return this.prisma.user.findUnique({
      where: { id },
      include: { tenantProfile: true },
    });
  }

  private async sendInvitationEmail(email: string, token: string, name: string) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const webBaseUrl = this.config.get<string>('WEB_BASE_URL') || 'http://localhost:3000';
    const inviteUrl = `${webBaseUrl}/auth/register?invite=${token}`;

    if (nodeEnv === 'production') {
      // In production, send via SES or notification service
      // For now, log — actual SES integration to be wired when notification-service is ready
      this.logger.log(`[PROD] Would send invitation email to ${email} with URL: ${inviteUrl}`);
    } else {
      // In dev/test, log the invitation
      this.logger.log(`[DEV] Invitation for ${name} (${email}): ${inviteUrl}`);
    }
  }
}
