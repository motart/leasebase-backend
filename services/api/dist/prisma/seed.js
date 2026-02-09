"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const landlordOrg = await prisma.organization.upsert({
        where: { subdomain: 'landlord-demo' },
        update: {
            plan: 'basic',
            unitCount: 4,
        },
        create: {
            type: client_1.OrganizationType.LANDLORD,
            name: 'Demo Landlord Org',
            plan: 'basic',
            subdomain: 'landlord-demo',
            unitCount: 4,
        },
    });
    const pmOrg = await prisma.organization.upsert({
        where: { subdomain: 'pm-demo' },
        update: {
            plan: 'basic',
        },
        create: {
            type: client_1.OrganizationType.PM_COMPANY,
            name: 'Demo PM Org',
            plan: 'basic',
            subdomain: 'pm-demo',
        },
    });
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
            role: client_1.UserRole.ORG_ADMIN,
        },
        create: {
            organizationId: landlordOrg.id,
            email: 'admin@landlord.local',
            name: 'Alice Admin',
            cognitoSub: 'dev-admin-landlord',
            role: client_1.UserRole.ORG_ADMIN,
        },
    });
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
            role: client_1.UserRole.TENANT,
        },
        create: {
            organizationId: landlordOrg.id,
            email: 'tenant@landlord.local',
            name: 'Terry Tenant',
            cognitoSub: 'dev-tenant-landlord',
            role: client_1.UserRole.TENANT,
        },
    });
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
    const units = await Promise.all(Array.from({ length: 4 }).map((_, index) => prisma.unit.create({
        data: {
            organizationId: landlordOrg.id,
            propertyId: property.id,
            unitNumber: `10${index + 1}`,
            bedrooms: 2,
            bathrooms: 1,
            squareFeet: 900,
            rentAmount: 200000,
        },
    })));
    const leasedUnit = units[0];
    const lease = await prisma.lease.create({
        data: {
            organizationId: landlordOrg.id,
            unitId: leasedUnit.id,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            rentAmount: 200000,
            depositAmount: 200000,
            status: client_1.LeaseStatus.ACTIVE,
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
    await prisma.ledgerEntry.create({
        data: {
            organizationId: landlordOrg.id,
            leaseId: lease.id,
            type: client_1.LedgerEntryType.CHARGE,
            amount: 200000,
            currency: 'usd',
            dueDate: new Date(),
            description: 'First month rent',
        },
    });
    await prisma.workOrder.create({
        data: {
            organizationId: landlordOrg.id,
            unitId: leasedUnit.id,
            createdByUserId: adminUser.id,
            tenantUserId: tenantUser.id,
            category: 'GENERAL',
            priority: client_1.WorkOrderPriority.MEDIUM,
            status: client_1.WorkOrderStatus.OPEN,
            description: 'Leaky faucet in kitchen',
        },
    });
    await prisma.subscription.upsert({
        where: {
            organizationId: landlordOrg.id,
        },
        update: {
            plan: 'per-unit-basic',
            unitCount: 4,
            status: client_1.SubscriptionStatus.ACTIVE,
        },
        create: {
            organizationId: landlordOrg.id,
            plan: 'per-unit-basic',
            unitCount: 4,
            stripeSubscriptionId: null,
            status: client_1.SubscriptionStatus.ACTIVE,
        },
    });
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
            role: client_1.UserRole.ORG_ADMIN,
        },
        create: {
            organizationId: pmOrg.id,
            email: 'admin@pm.local',
            name: 'Paula PM',
            cognitoSub: 'dev-admin-pm',
            role: client_1.UserRole.ORG_ADMIN,
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
//# sourceMappingURL=seed.js.map