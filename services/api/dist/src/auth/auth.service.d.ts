import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
export declare class AuthService {
    private readonly config;
    private readonly prisma;
    private jwks;
    constructor(config: ConfigService, prisma: PrismaService);
    private get devBypassEnabled();
    getCurrentUserFromRequest(req: any): Promise<CurrentUser>;
    private handleDevBypass;
    private verifyCognitoJwt;
    private mapPayloadToUser;
}
