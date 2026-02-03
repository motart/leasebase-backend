import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { CreateOrgDto, CreateOrgUserDto, UpdateOrgUserDto } from './dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('orgs')
@ApiBearerAuth()
@Controller('orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Bootstrap a new organization with initial admin user' })
  createOrg(@Body() dto: CreateOrgDto) {
    return this.orgsService.bootstrapOrganization(dto);
  }

  @Get('me')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.OWNER, UserRole.TENANT)
  @ApiOperation({ summary: 'Get current organization info' })
  getMe(@CurrentUserDecorator() user: CurrentUser) {
    return this.orgsService.getCurrentOrg(user);
  }

  @Post('users')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Create/invite user in current organization' })
  createUser(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateOrgUserDto,
  ) {
    return this.orgsService.createUserInOrg(user, dto);
  }

  @Get('users')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'List users in current organization' })
  listUsers(@CurrentUserDecorator() user: CurrentUser) {
    return this.orgsService.listUsers(user);
  }

  @Patch('users/:id')
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Update user role/status in current organization' })
  updateUser(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrgUserDto,
  ) {
    return this.orgsService.updateUser(user, id, dto);
  }
}
