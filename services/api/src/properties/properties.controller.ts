import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreatePropertyDto, UpdatePropertyDto } from './dto';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.OWNER)
  @ApiOperation({ summary: 'List properties for current organization' })
  list(@CurrentUserDecorator() user: CurrentUser) {
    return this.propertiesService.list(user);
  }

  @Get('summary')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.OWNER)
  @ApiOperation({ summary: 'Get property/unit summary stats' })
  summary(@CurrentUserDecorator() user: CurrentUser) {
    return this.propertiesService.getSummary(user);
  }

  @Get(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.OWNER)
  @ApiOperation({ summary: 'Get property by ID with units' })
  getById(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.propertiesService.getById(user, id);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Create a new property' })
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user, dto);
  }

  @Put(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Update a property' })
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a property' })
  remove(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.propertiesService.delete(user, id);
  }
}
