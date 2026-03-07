import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { CreateUnitDto, UpdateUnitDto } from './dto/units.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProperty(user: CurrentUser, propertyId: string) {
    // Verify property belongs to org
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId: user.orgId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return this.prisma.unit.findMany({
      where: { propertyId, organizationId: user.orgId },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async create(user: CurrentUser, propertyId: string, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, organizationId: user.orgId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const unit = await this.prisma.unit.create({
      data: {
        organizationId: user.orgId,
        propertyId,
        unitNumber: dto.unitNumber,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        squareFeet: dto.squareFeet,
        rentAmount: dto.rentAmount,
        securityDeposit: dto.securityDeposit,
        status: dto.status ?? 'AVAILABLE',
      },
    });

    // Check if all expected units are now created for this property
    const unitCount = await this.prisma.unit.count({
      where: { propertyId, organizationId: user.orgId },
    });

    if (unitCount >= property.numberOfUnits) {
      await this.prisma.onboardingProgress.updateMany({
        where: {
          userId: user.id,
          unitsConfigured: false,
        },
        data: {
          unitsConfigured: true,
          currentStep: 'add_tenants',
        },
      });
    }

    return unit;
  }

  async update(user: CurrentUser, unitId: string, dto: UpdateUnitDto) {
    const existing = await this.prisma.unit.findFirst({
      where: { id: unitId, organizationId: user.orgId },
    });
    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: {
        ...(dto.unitNumber !== undefined && { unitNumber: dto.unitNumber }),
        ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
        ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
        ...(dto.squareFeet !== undefined && { squareFeet: dto.squareFeet }),
        ...(dto.rentAmount !== undefined && { rentAmount: dto.rentAmount }),
        ...(dto.securityDeposit !== undefined && { securityDeposit: dto.securityDeposit }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async delete(user: CurrentUser, unitId: string) {
    const existing = await this.prisma.unit.findFirst({
      where: { id: unitId, organizationId: user.orgId },
    });
    if (!existing) {
      throw new NotFoundException('Unit not found');
    }

    await this.prisma.unit.delete({ where: { id: unitId } });
  }
}
