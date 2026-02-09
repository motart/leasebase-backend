import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token for API authentication' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT ID token containing user claims' })
  idToken!: string;

  @ApiProperty({ description: 'Refresh token for obtaining new access tokens' })
  refreshToken?: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn!: number;
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Whether the user needs to confirm their email' })
  userConfirmed!: boolean;

  @ApiProperty({ description: 'Cognito user sub (unique identifier)' })
  userSub!: string;

  @ApiProperty({ description: 'Success message' })
  message!: string;
}
