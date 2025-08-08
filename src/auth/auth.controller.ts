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
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/models/user.models';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: { user: Omit<User, 'password'> },
  ) {
    return await this.authService.login(req.user);
  }

  @Get('password/:password')
  async getPasswordHash(@Param('password') password: string) {
    return this.usersService.generate_password_hash(password);
  }

  // Пример защищенного маршрута
  @UseGuards(AuthGuard('jwt'))
  @Post('profile')
  getProfile(@Request() req: { user: Omit<User, 'password'> }) {
    if (!req.user.email) {
      return { error: 'Email is missing from user object' };
    }
    const user = this.usersService.findOneByEmail(req.user.email);
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
  }
}
