import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

  @Get('jwt-secret')
  getJwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    return secret;
  }
}
