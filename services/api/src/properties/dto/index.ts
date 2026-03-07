import { ApiProperty } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Property name', example: 'Sunset Apartments' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: PropertyType, default: PropertyType.OTHER })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'WA' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '98101' })
  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @ApiProperty({ default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Number of units', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfUnits?: number;
}

export class UpdatePropertyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: PropertyType, required: false })
  @IsOptional()
  @IsEnum(PropertyType)
  propertyType?: PropertyType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfUnits?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
