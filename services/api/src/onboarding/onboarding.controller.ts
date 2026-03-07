import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { CurrentUserDecorator } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Get current user onboarding progress' })
  getProgress(@CurrentUserDecorator() user: CurrentUser) {
    return this.onboardingService.getProgress(user);
  }

  @Patch('progress')
  @ApiOperation({ summary: 'Update onboarding progress' })
  updateProgress(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpdateOnboardingDto,
  ) {
    return this.onboardingService.updateProgress(user, dto);
  }

  @Post('dismiss')
  @ApiOperation({ summary: 'Dismiss onboarding walkthrough' })
  dismiss(@CurrentUserDecorator() user: CurrentUser) {
    return this.onboardingService.dismissWalkthrough(user);
  }
}
