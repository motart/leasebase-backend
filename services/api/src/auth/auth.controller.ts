import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { CurrentUserDto } from './dto/current-user.dto';
import { AuthConfigDto } from './dto/auth-config.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user info from Cognito token' })
  @ApiOkResponse({ type: CurrentUserDto })
  me(@CurrentUserDecorator() user: CurrentUser): CurrentUserDto {
    // Shape of CurrentUser matches CurrentUserDto
    return user as CurrentUserDto;
  }

  @Public()
  @Get('config')
  @ApiOperation({ summary: 'Get public Cognito configuration used by this API' })
  @ApiOkResponse({ type: AuthConfigDto })
  getConfig(): AuthConfigDto {
    const region = this.config.get<string>('COGNITO_REGION') ?? '';
    const userPoolId = this.config.get<string>('COGNITO_USER_POOL_ID') ?? '';
    const clientId = this.config.get<string>('COGNITO_CLIENT_ID') ?? '';

    const issuer = region && userPoolId
      ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
      : '';
    const jwksUri = issuer ? `${issuer}/.well-known/jwks.json` : '';

    return {
      region,
      userPoolId,
      clientId,
      issuer,
      jwksUri,
    };
  }
}
