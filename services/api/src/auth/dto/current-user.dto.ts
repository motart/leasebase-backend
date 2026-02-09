import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CurrentUserDto {
  @ApiProperty({ description: 'Internal user id' })
  id!: string;

  @ApiProperty({ description: 'Organization id for the current user' })
  orgId!: string;

  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'Display name (usually email for now' })
  name!: string;

  @ApiProperty({ enum: UserRole, description: 'Role within the organization' })
  role!: UserRole;
}
