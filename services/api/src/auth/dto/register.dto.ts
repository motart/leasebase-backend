import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum RegisterUserType {
  PROPERTY_MANAGER = 'PROPERTY_MANAGER',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'User password (min 8 characters)', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    description: 'User type / persona',
    enum: RegisterUserType,
    required: false,
    example: 'PROPERTY_MANAGER',
  })
  @IsOptional()
  @IsEnum(RegisterUserType)
  userType?: RegisterUserType;

  @ApiProperty({ description: 'Company or business name', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;
}
