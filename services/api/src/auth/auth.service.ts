import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { OrganizationType, UserRole } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class AuthService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get devBypassEnabled(): boolean {
    return this.config.get<string>('DEV_AUTH_BYPASS') === 'true';
  }

  async getCurrentUserFromRequest(req: any): Promise<CurrentUser> {
    if (this.devBypassEnabled) {
      return this.handleDevBypass(req);
    }

    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length);
    const payload = await this.verifyCognitoJwt(token);
    return this.mapPayloadToUser(payload);
  }

  private async handleDevBypass(req: any): Promise<CurrentUser> {
    const email = (req.headers['x-dev-user-email'] || '') as string;
    const roleHeader = (req.headers['x-dev-user-role'] || '') as string;
    const orgIdHeader = (req.headers['x-dev-org-id'] || '') as string;

    if (!email || !roleHeader || !orgIdHeader) {
      throw new UnauthorizedException(
        'DEV_AUTH_BYPASS enabled but dev headers are missing (x-dev-user-email, x-dev-user-role, x-dev-org-id)',
      );
    }

    const role = (roleHeader.toUpperCase() as UserRole) ?? UserRole.ORG_ADMIN;

    const org = await this.prisma.organization.upsert({
      where: { id: orgIdHeader },
      update: {},
      create: {
        id: orgIdHeader,
        type: OrganizationType.PM_COMPANY,
        name: `Dev Org ${orgIdHeader}`,
        plan: 'dev',
      },
    });

    const user = await this.prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email } },
      update: { role },
      create: {
        organizationId: org.id,
        email,
        name: email,
        role,
      },
    });

    return {
      id: user.id,
      orgId: org.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private async verifyCognitoJwt(token: string): Promise<JWTPayload> {
    const region = this.config.get<string>('COGNITO_REGION');
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID');
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');

    if (!region || !userPoolId || !clientId) {
      throw new UnauthorizedException('Cognito configuration is missing');
    }

    if (!this.jwks) {
      const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
      const jwksUri = new URL(`${issuer}/.well-known/jwks.json`);
      this.jwks = createRemoteJWKSet(jwksUri);
    }

    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

    const { payload } = await jwtVerify(token, this.jwks!, {
      issuer,
      audience: clientId,
    });

    return payload;
  }

  private async mapPayloadToUser(payload: JWTPayload): Promise<CurrentUser> {
    const sub = payload.sub as string | undefined;
    const email = (payload.email as string | undefined) ?? '';
    const orgIdClaim = (payload['custom:orgId'] as string | undefined) ?? '';
    const roleClaim = (payload['custom:role'] as string | undefined) ?? 'TENANT';

    if (!sub || !email || !orgIdClaim) {
      throw new UnauthorizedException('JWT is missing required claims');
    }

    const role = (roleClaim.toUpperCase() as UserRole) ?? UserRole.TENANT;

    const org = await this.prisma.organization.findUnique({ where: { id: orgIdClaim } });
    if (!org) {
      throw new UnauthorizedException('Organization not found for token');
    }

    const user = await this.prisma.user.upsert({
      where: { organizationId_email: { organizationId: org.id, email } },
      update: { cognitoSub: sub, role },
      create: {
        organizationId: org.id,
        email,
        name: email,
        cognitoSub: sub,
        role,
      },
    });

    return {
      id: user.id,
      orgId: org.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
