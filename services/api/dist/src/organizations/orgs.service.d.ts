import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto, CreateOrgUserDto, UpdateOrgUserDto } from './dto';
import { CurrentUser } from '../common/interfaces/current-user.interface';
export declare class OrgsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    bootstrapOrganization(dto: CreateOrgDto): Promise<{
        organization: {
            id: string;
            type: import(".prisma/client").$Enums.OrganizationType;
            name: string;
            plan: string;
            subdomain: string | null;
            stripeCustomerId: string | null;
            stripeSubscriptionId: string | null;
            unitCount: number;
            createdAt: Date;
            updatedAt: Date;
        };
        adminUser: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            cognitoSub: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: string;
            organizationId: string;
        };
    }>;
    getCurrentOrg(currentUser: CurrentUser): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.OrganizationType;
        name: string;
        plan: string;
        subdomain: string | null;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        unitCount: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createUserInOrg(currentUser: CurrentUser, dto: CreateOrgUserDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        cognitoSub: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: string;
        organizationId: string;
    }>;
    listUsers(currentUser: CurrentUser): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        cognitoSub: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: string;
        organizationId: string;
    }[]>;
    updateUser(currentUser: CurrentUser, userId: string, dto: UpdateOrgUserDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        cognitoSub: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: string;
        organizationId: string;
    }>;
}
