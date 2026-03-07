import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { CreatePropertyDto, UpdatePropertyDto } from './dto';
import { PropertyType } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: CurrentUser) {
    const properties = await this.prisma.property.findMany({
      where: { organizationId: user.orgId },
      include: {
        _count: { select: { units: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((p) => ({
      ...p,
      unitCount: p._count.units,
      _count: undefined,
    }));
  }

  async getById(user: CurrentUser, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, organizationId: user.orgId },
      include: {
        units: { orderBy: { unitNumber: 'asc' } },
        _count: { select: { units: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return {
      ...property,
      unitCount: property._count.units,
      _count: undefined,
    };
  }

  async create(user: CurrentUser, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: {
        organizationId: user.orgId,
        name: dto.name,
        propertyType: dto.propertyType ?? PropertyType.OTHER,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        country: dto.country ?? 'US',
        numberOfUnits: dto.numberOfUnits ?? 1,
      },
    });

    // Update onboarding progress
    await this.prisma.onboardingProgress.updateMany({
      where: {
        userId: user.id,
        firstPropertyAdded: false,
      },
      data: {
        firstPropertyAdded: true,
        currentStep: 'add_units',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId: user.orgId,
        userId: user.id,
        action: 'PROPERTY_CREATED',
        entityType: 'Property',
        entityId: property.id,
        metadataJson: { name: property.name },
      },
    });

    return property;
  }

  async update(user: CurrentUser, id: string, dto: UpdatePropertyDto) {
    const existing = await this.prisma.property.findFirst({
      where: { id, organizationId: user.orgId },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.propertyType !== undefined && { propertyType: dto.propertyType }),
        ...(dto.addressLine1 !== undefined && { addressLine1: dto.addressLine1 }),
        ...(dto.addressLine2 !== undefined && { addressLine2: dto.addressLine2 }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.numberOfUnits !== undefined && { numberOfUnits: dto.numberOfUnits }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async delete(user: CurrentUser, id: string) {
    const existing = await this.prisma.property.findFirst({
      where: { id, organizationId: user.orgId },
    });

    if (!existing) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.property.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.orgId,
        userId: user.id,
        action: 'PROPERTY_DELETED',
        entityType: 'Property',
        entityId: id,
        metadataJson: { name: existing.name },
      },
    });
  }

  /** Summary stats for dashboard */
  async getSummary(user: CurrentUser) {
    const [propertyCount, unitCount, occupiedCount] = await Promise.all([
      this.prisma.property.count({
        where: { organizationId: user.orgId, status: 'ACTIVE' },
      }),
      this.prisma.unit.count({
        where: { organizationId: user.orgId },
      }),
      this.prisma.unit.count({
        where: { organizationId: user.orgId, status: 'OCCUPIED' },
      }),
    ]);

    const occupancyRate = unitCount > 0 ? Math.round((occupiedCount / unitCount) * 100) : 0;

    return {
      propertyCount,
      unitCount,
      occupiedCount,
      vacantCount: unitCount - occupiedCount,
      occupancyRate,
    };
  }
}
