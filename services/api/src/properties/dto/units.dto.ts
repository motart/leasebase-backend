import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  unitNumber!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  bedrooms!: number;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  bathrooms!: number;

  @ApiProperty({ required: false, example: 900 })
  @IsOptional()
  @IsInt()
  @Min(0)
  squareFeet?: number;

  @ApiProperty({ description: 'Monthly rent in cents', example: 200000 })
  @IsInt()
  @Min(0)
  rentAmount!: number;

  @ApiProperty({ description: 'Security deposit in cents', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ default: 'AVAILABLE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateUnitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  squareFeet?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  rentAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  securityDeposit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
