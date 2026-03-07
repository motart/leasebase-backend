import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { InvitationStatus, UserRole } from '@prisma/client';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async list(user: CurrentUser) {
    return this.prisma.invitation.findMany({
      where: { organizationId: user.orgId },
      include: {
        property: { select: { id: true, name: true } },
        unit: { select: { id: true, unitNumber: true } },
        invitedByUser: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async send(
    user: CurrentUser,
    data: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      propertyId?: string;
      unitId?: string;
    },
  ) {
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId: user.orgId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: UserRole.TENANT,
        propertyId: data.propertyId,
        unitId: data.unitId,
        invitedByUserId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.dispatchEmail(invitation.email, invitation.token, data.firstName);
    return invitation;
  }

  async resend(user: CurrentUser, id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, organizationId: user.orgId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const updated = await this.prisma.invitation.update({
      where: { id },
      data: {
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.dispatchEmail(updated.email, updated.token, updated.firstName);
    return updated;
  }

  async cancel(user: CurrentUser, id: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id, organizationId: user.orgId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.CANCELLED },
    });
  }

  private async dispatchEmail(email: string, token: string, name?: string | null) {
    const nodeEnv = this.config.get<string>('NODE_ENV');
    const webBaseUrl = this.config.get<string>('WEB_BASE_URL') || 'http://localhost:3000';
    const inviteUrl = `${webBaseUrl}/auth/register?invite=${token}`;

    if (nodeEnv === 'production') {
      this.logger.log(`[PROD] Would dispatch invitation email to ${email}`);
    } else {
      this.logger.log(`[DEV] Invitation for ${name || 'user'} (${email}): ${inviteUrl}`);
    }
  }
}
