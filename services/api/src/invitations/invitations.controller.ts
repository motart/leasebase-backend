import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class SendInvitationDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitId?: string;
}

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'List invitations for organization' })
  list(@CurrentUserDecorator() user: CurrentUser) {
    return this.invitationsService.list(user);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Send a tenant invitation' })
  send(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: SendInvitationDto,
  ) {
    return this.invitationsService.send(user, dto);
  }

  @Post(':id/resend')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Resend an invitation' })
  resend(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.invitationsService.resend(user, id);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.PM_STAFF)
  @ApiOperation({ summary: 'Cancel an invitation' })
  cancel(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.invitationsService.cancel(user, id);
  }
}
