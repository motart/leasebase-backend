import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { OrganizationType, UserRole } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  AuthFlowType,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, RegisterResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private cognitoClient: CognitoIdentityProviderClient;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const region = this.config.get<string>('COGNITO_REGION') || 'us-west-2';
    this.cognitoClient = new CognitoIdentityProviderClient({ region });
  }

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

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Cognito client ID is not configured');
    }

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: clientId,
        AuthParameters: {
          USERNAME: dto.email,
          PASSWORD: dto.password,
        },
      });

      const response = await this.cognitoClient.send(command);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Authentication failed');
      }

      return {
        accessToken: response.AuthenticationResult.AccessToken!,
        idToken: response.AuthenticationResult.IdToken!,
        refreshToken: response.AuthenticationResult.RefreshToken,
        expiresIn: response.AuthenticationResult.ExpiresIn ?? 3600,
      };
    } catch (error: any) {
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid email or password');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new BadRequestException('Please verify your email before logging in');
      }
      if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw error;
    }
  }

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Cognito client ID is not configured');
    }

    try {
      const command = new SignUpCommand({
        ClientId: clientId,
        Username: dto.email,
        Password: dto.password,
        UserAttributes: [
          { Name: 'email', Value: dto.email },
          { Name: 'given_name', Value: dto.firstName },
          { Name: 'family_name', Value: dto.lastName },
        ],
      });

      const response = await this.cognitoClient.send(command);

      return {
        userConfirmed: response.UserConfirmed ?? false,
        userSub: response.UserSub ?? '',
        message: response.UserConfirmed
          ? 'Registration successful. You can now log in to Leasebase.'
          : 'Registration successful. Please check your email for a Leasebase verification code.',
      };
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('An account with this email already exists');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Password does not meet requirements');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException(error.message || 'Invalid registration data');
      }
      throw error;
    }
  }

  async confirmEmail(email: string, code: string): Promise<{ message: string }> {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Cognito client ID is not configured');
    }

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
      });

      await this.cognitoClient.send(command);

      return {
        message: 'Your email has been verified. You can now sign in to Leasebase.',
      };
    } catch (error: any) {
      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('The verification code is incorrect. Please try again.');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException('The verification code has expired. Please request a new code.');
      }
      if (error.name === 'UserNotFoundException') {
        throw new BadRequestException('No account was found for this email.');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new BadRequestException('This email is already verified. You can sign in.');
      }
      throw error;
    }
  }

  async resendConfirmationCode(email: string): Promise<{ message: string }> {
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Cognito client ID is not configured');
    }

    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: clientId,
        Username: email,
      });

      await this.cognitoClient.send(command);

      return {
        message: 'We have sent a new Leasebase verification code to your email.',
      };
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        throw new BadRequestException('No account was found for this email.');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException(error.message || 'Unable to resend verification code.');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new BadRequestException('This email is already verified. You can sign in.');
      }
      throw error;
    }
  }
}
