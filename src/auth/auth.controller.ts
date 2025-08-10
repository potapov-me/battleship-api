import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MESSAGES } from 'src/shared/constants/messages';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/schemas/user.schema';
import { LoginDto } from 'src/auth/dto/login.dto';
import { EmailFormatGuard } from './guards/email-format.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  LoginResponseDto,
  RegisterResponseDto,
  ProfileResponseDto,
  ErrorResponseDto,
} from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @UseGuards(EmailFormatGuard, AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неверные учетные данные',
    type: ErrorResponseDto,
  })
  login(@Body() login: LoginDto) {
    return this.authService.login(login);
  }

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации данных',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(
      registerDto.username,
      registerDto.email,
      registerDto.password,
    );
    return result;
  }

  @Get('confirm-email')
  @ApiOperation({ summary: 'Подтверждение email по токену' })
  @ApiQuery({
    name: 'token',
    description: 'Токен подтверждения email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Email успешно подтвержден',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Email успешно подтвержден' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Токен не предоставлен или недействителен',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'Токен обязателен' },
      },
    },
  })
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

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiOperation({ summary: 'Получить профиль пользователя' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
    type: ErrorResponseDto,
  })
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
