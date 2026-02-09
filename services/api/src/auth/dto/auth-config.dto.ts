import { ApiProperty } from '@nestjs/swagger';

export class AuthConfigDto {
  @ApiProperty({ description: 'AWS region for the Cognito User Pool' })
  region!: string;

  @ApiProperty({ description: 'Cognito User Pool ID' })
  userPoolId!: string;

  @ApiProperty({ description: 'Cognito App Client ID used by the web frontend' })
  clientId!: string;

  @ApiProperty({ description: 'Expected JWT issuer URL for this user pool' })
  issuer!: string;

  @ApiProperty({ description: 'JWKS URL used by the API to validate tokens' })
  jwksUri!: string;
}
