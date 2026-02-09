import 'dotenv/config';
import {
  LeaseStatus,
  LedgerEntryType,
  OrganizationType,
  PrismaClient,
  SubscriptionStatus,
  UserRole,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Landlord organization
  const landlordOrg = await prisma.organization.upsert({
    where: { subdomain: 'landlord-demo' },
    update: {
      plan: 'basic',
      unitCount: 4,
    },
    create: {
      type: OrganizationType.LANDLORD,
      name: 'Demo Landlord Org',
      plan: 'basic',
      subdomain: 'landlord-demo',
      unitCount: 4,
    },
  });

  // Property manager organization
  const pmOrg = await prisma.organization.upsert({
    where: { subdomain: 'pm-demo' },
    update: {
      plan: 'basic',
    },
    create: {
      type: OrganizationType.PM_COMPANY,
      name: 'Demo PM Org',
      plan: 'basic',
      subdomain: 'pm-demo',
    },
  });

  // Admin user for landlord org
  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: landlordOrg.id,
        email: 'admin@landlord.local',
      },
    },
    update: {
      name: 'Alice Admin',
      cognitoSub: 'dev-admin-landlord',
      role: UserRole.ORG_ADMIN,
    },
    create: {
      organizationId: landlordOrg.id,
      email: 'admin@landlord.local',
      name: 'Alice Admin',
      cognitoSub: 'dev-admin-landlord',
      role: UserRole.ORG_ADMIN,
    },
  });

  // Tenant user for landlord org
  const tenantUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: landlordOrg.id,
        email: 'tenant@landlord.local',
      },
    },
    update: {
      name: 'Terry Tenant',
      cognitoSub: 'dev-tenant-landlord',
      role: UserRole.TENANT,
    },
    create: {
      organizationId: landlordOrg.id,
      email: 'tenant@landlord.local',
      name: 'Terry Tenant',
      cognitoSub: 'dev-tenant-landlord',
      role: UserRole.TENANT,
    },
  });

  // Demo property with four units
  const property = await prisma.property.create({
    data: {
      organizationId: landlordOrg.id,
      name: 'Demo Apartments',
      addressLine1: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
      country: 'US',
    },
  });

  const units = await Promise.all(
    Array.from({ length: 4 }).map((_, index) =>
      prisma.unit.create({
        data: {
          organizationId: landlordOrg.id,
          propertyId: property.id,
          unitNumber: `10${index + 1}`,
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 900,
          rentAmount: 200_000, // $2,000.00
        },
      }),
    ),
  );

  const leasedUnit = units[0];

  const lease = await prisma.lease.create({
    data: {
      organizationId: landlordOrg.id,
      unitId: leasedUnit.id,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      rentAmount: 200_000,
      depositAmount: 200_000,
      status: LeaseStatus.ACTIVE,
    },
  });

  const tenantProfile = await prisma.tenantProfile.upsert({
    where: { userId: tenantUser.id },
    update: {
      leaseId: lease.id,
      phone: '+1-555-0100',
    },
    create: {
      userId: tenantUser.id,
      leaseId: lease.id,
      phone: '+1-555-0100',
    },
  });

  // Initial ledger entry for first month rent
  await prisma.ledgerEntry.create({
    data: {
      organizationId: landlordOrg.id,
      leaseId: lease.id,
      type: LedgerEntryType.CHARGE,
      amount: 200_000,
      currency: 'usd',
      dueDate: new Date(),
      description: 'First month rent',
    },
  });

  // Demo work order on leased unit
  await prisma.workOrder.create({
    data: {
      organizationId: landlordOrg.id,
      unitId: leasedUnit.id,
      createdByUserId: adminUser.id,
      tenantUserId: tenantUser.id,
      category: 'GENERAL',
      priority: WorkOrderPriority.MEDIUM,
      status: WorkOrderStatus.OPEN,
      description: 'Leaky faucet in kitchen',
    },
  });

  // Basic subscription row for landlord org
  await prisma.subscription.upsert({
    where: {
      organizationId: landlordOrg.id,
    },
    update: {
      plan: 'per-unit-basic',
      unitCount: 4,
      status: SubscriptionStatus.ACTIVE,
    },
    create: {
      organizationId: landlordOrg.id,
      plan: 'per-unit-basic',
      unitCount: 4,
      stripeSubscriptionId: null,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  // Minimal PM org admin user (no leases/data attached yet)
  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: pmOrg.id,
        email: 'admin@pm.local',
      },
    },
    update: {
      name: 'Paula PM',
      cognitoSub: 'dev-admin-pm',
      role: UserRole.ORG_ADMIN,
    },
    create: {
      organizationId: pmOrg.id,
      email: 'admin@pm.local',
      name: 'Paula PM',
      cognitoSub: 'dev-admin-pm',
      role: UserRole.ORG_ADMIN,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed data created');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
