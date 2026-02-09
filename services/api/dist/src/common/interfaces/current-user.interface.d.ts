import { UserRole } from '@prisma/client';
export interface CurrentUser {
    id: string;
    orgId: string;
    email: string;
    name: string;
    role: UserRole;
}
