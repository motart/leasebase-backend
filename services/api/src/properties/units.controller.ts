import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateUnitDto, UpdateUnitDto } from './dto/units.dto';

@ApiTags('units')
@ApiBearerAuth()
@Controller()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('properties/:propertyId/units')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF, UserRole.OWNER)
  @ApiOperation({ summary: 'List units for a property' })
  list(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('propertyId') propertyId: string,
  ) {
    return this.unitsService.listByProperty(user, propertyId);
  }

  @Post('properties/:propertyId/units')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Create a unit for a property' })
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.create(user, propertyId, dto);
  }

  @Put('units/:id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Update a unit' })
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitsService.update(user, id, dto);
  }

  @Delete('units/:id')
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Delete a unit' })
  remove(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.unitsService.delete(user, id);
  }
}
