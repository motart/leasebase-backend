import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(user: CurrentUser) {
    const progress = await this.prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!progress) {
      // Auto-create if missing (e.g., legacy users)
      return this.prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          organizationId: user.orgId,
          orgCreated: true,
          currentStep: 'add_property',
        },
      });
    }

    return progress;
  }

  async updateProgress(user: CurrentUser, dto: UpdateOnboardingDto) {
    const existing = await this.prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      throw new NotFoundException('Onboarding progress not found');
    }

    const data: Record<string, any> = {};

    if (dto.currentStep !== undefined) data.currentStep = dto.currentStep;
    if (dto.firstPropertyAdded !== undefined) data.firstPropertyAdded = dto.firstPropertyAdded;
    if (dto.unitsConfigured !== undefined) data.unitsConfigured = dto.unitsConfigured;
    if (dto.tenantsInvited !== undefined) data.tenantsInvited = dto.tenantsInvited;
    if (dto.walkthroughDismissed !== undefined) data.walkthroughDismissed = dto.walkthroughDismissed;

    // Auto-complete when all steps done
    const merged = { ...existing, ...data };
    if (
      merged.orgCreated &&
      merged.firstPropertyAdded &&
      merged.unitsConfigured &&
      !merged.completedAt
    ) {
      data.completedAt = new Date();
      data.currentStep = 'complete';
    }

    return this.prisma.onboardingProgress.update({
      where: { userId: user.id },
      data,
    });
  }

  async dismissWalkthrough(user: CurrentUser) {
    const existing = await this.prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      return this.prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          organizationId: user.orgId,
          orgCreated: true,
          walkthroughDismissed: true,
          currentStep: 'add_property',
        },
      });
    }

    return this.prisma.onboardingProgress.update({
      where: { userId: user.id },
      data: { walkthroughDismissed: true },
    });
  }
}
