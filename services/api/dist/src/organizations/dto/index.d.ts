import { OrganizationType, UserRole } from '@prisma/client';
export declare class CreateOrgDto {
    name: string;
    type: OrganizationType;
    plan?: string;
    adminEmail: string;
    adminName?: string;
}
export declare class CreateOrgUserDto {
    email: string;
    name: string;
    role: UserRole;
}
export declare class UpdateOrgUserDto {
    role?: UserRole;
    status?: string;
}
