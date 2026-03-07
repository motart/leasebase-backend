import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOnboardingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currentStep?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  firstPropertyAdded?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  unitsConfigured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  tenantsInvited?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  walkthroughDismissed?: boolean;
}
