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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req: { user: Omit<User, 'password'> }) {
    return this.authService.login(req.user);
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
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
