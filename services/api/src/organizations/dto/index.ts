import { OrganizationType, UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: OrganizationType })
  @IsEnum(OrganizationType)
  type!: OrganizationType;

  @ApiProperty({ required: false, default: 'basic' })
  @IsOptional()
  @IsString()
  plan?: string;

  @ApiProperty()
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  adminName?: string;
}

export class CreateOrgUserDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateOrgUserDto {
  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
