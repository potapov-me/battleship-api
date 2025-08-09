import { Controller, Post, Body, UseGuards, Request, Get, Param, Query } from '@nestjs/common';
import { MESSAGES } from 'src/shared/constants/messages';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/schemas/user.schema';
import { LoginDto } from 'src/auth/dto/login.dto';
import { EmailFormatGuard } from './guards/email-format.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(EmailFormatGuard, AuthGuard('local'))
  @Post('login')
  login(@Body() login: LoginDto) {
    return this.authService.login(login);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      return result;
    } catch (error) {
      return {
        error: error.message,
      };
    }
  }

  @Get('confirm-email')
  async confirmEmail(@Query('token') token?: string) {
    if (!token) {
      return { error: MESSAGES.errors.tokenRequired };
    }
    const confirmed = await this.usersService.confirmEmailByToken(token);
    if (!confirmed) {
      return { error: MESSAGES.errors.invalidOrExpiredToken };
    }
    return { message: MESSAGES.auth.confirmEmail.success };
  }

  @Get('password/:password')
  async getPasswordHash(@Param('password') password: string) {
    return this.usersService.generate_password_hash(password);
  }

  // Пример защищенного маршрута
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async getProfile(@Request() req: { user: Omit<User, 'password'> }) {
    if (!req.user.email) {
      return { error: MESSAGES.errors.emailMissing };
    }
    const user = await this.usersService.findOneByEmail(req.user.email);

    if (user) {
      const { username, email, roles } = user;
      return { username, email, roles };
    }
  }
}
