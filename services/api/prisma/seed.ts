import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { subdomain: 'demo' },
    update: {},
    create: {
      name: 'Demo Property Management',
      subdomain: 'demo',
      plan: 'basic',
      units: 10,
    },
  });

  const owner = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'owner@demo.local' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'owner@demo.local',
      cognitoSub: 'local-owner-demo',
      role: 'OWNER',
      firstName: 'Olivia',
      lastName: 'Owner',
    },
  });

  const property = await prisma.property.create({
    data: {
      organizationId: org.id,
      name: 'Demo Apartments',
      addressLine1: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      postalCode: '98101',
    },
  });

  const unit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: '101',
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 900,
    },
  });

  const lease = await prisma.lease.create({
    data: {
      organizationId: org.id,
      unitId: unit.id,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      rentAmountCents: 200000,
      status: 'ACTIVE',
    },
  });

  const tenantUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'tenant@demo.local',
      cognitoSub: 'local-tenant-demo',
      role: 'TENANT',
      firstName: 'Terry',
      lastName: 'Tenant',
    },
  });

  await prisma.tenantProfile.create({
    data: {
      userId: tenantUser.id,
      leaseId: lease.id,
      phone: '+1-555-0100',
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      organizationId: org.id,
      leaseId: lease.id,
      type: 'CHARGE',
      amountCents: 200000,
      description: 'First month rent',
      effectiveDate: new Date(),
    },
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
