import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateTenantDto, UpdateTenantDto } from './dto';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'List tenants in organization' })
  list(@CurrentUserDecorator() user: CurrentUser) {
    return this.tenantsService.list(user);
  }

  @Get(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.TENANT)
  @ApiOperation({ summary: 'Get tenant by ID' })
  getById(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.tenantsService.getById(user, id);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Create a tenant with optional invitation' })
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateTenantDto,
  ) {
    return this.tenantsService.create(user, dto);
  }

  @Put(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Update tenant info' })
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(user, id, dto);
  }
}
