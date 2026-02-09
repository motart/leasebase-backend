import { OrgsService } from './orgs.service';
import { CreateOrgDto, CreateOrgUserDto, UpdateOrgUserDto } from './dto';
import { CurrentUser } from '../common/interfaces/current-user.interface';
export declare class OrgsController {
    private readonly orgsService;
    constructor(orgsService: OrgsService);
    createOrg(dto: CreateOrgDto): Promise<{
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
    getMe(user: CurrentUser): Promise<{
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
    createUser(user: CurrentUser, dto: CreateOrgUserDto): Promise<{
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
    listUsers(user: CurrentUser): import(".prisma/client").Prisma.PrismaPromise<{
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
    updateUser(user: CurrentUser, id: string, dto: UpdateOrgUserDto): Promise<{
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
