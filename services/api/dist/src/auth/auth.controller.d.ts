import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../common/interfaces/current-user.interface';
import { CurrentUserDto } from './dto/current-user.dto';
import { AuthConfigDto } from './dto/auth-config.dto';
export declare class AuthController {
    private readonly config;
    constructor(config: ConfigService);
    me(user: CurrentUser): CurrentUserDto;
    getConfig(): AuthConfigDto;
}
