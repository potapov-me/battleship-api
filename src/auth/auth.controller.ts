import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/schemas/user.schema';
import { LoginDto } from 'src/auth/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('local'))
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

  @Get('password/:password')
  async getPasswordHash(@Param('password') password: string) {
    return this.usersService.generate_password_hash(password);
  }

  // Пример защищенного маршрута
  @UseGuards(AuthGuard('jwt'))
  @Post('profile')
  async getProfile(@Request() req: { user: Omit<User, 'password'> }) {
    if (!req.user.email) {
      return { error: 'Email is missing from user object' };
    }
    const user = await this.usersService.findOneByEmail(req.user.email);

    if (user) {
      const { username, email, roles } = user;
      return { username, email, roles };
    }
  }
}
