import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiCreatedResponse, ApiBadRequestResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { CurrentUserDto } from './dto/current-user.dto';
import { AuthConfigDto } from './dto/auth-config.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {}
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

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBadRequestResponse({ description: 'User not confirmed or invalid request' })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiCreatedResponse({ type: RegisterResponseDto, description: 'Registration successful' })
  @ApiBadRequestResponse({ description: 'Email already exists or invalid data' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }
}
