import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Query,
  HttpCode,
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
  @HttpCode(200)
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
  async login(@Body() login: LoginDto) {
    return await this.authService.login(login);
  }

  @Post('register')
  @HttpCode(201)
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
  @HttpCode(200)
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
  @Get('profile')
  @HttpCode(200)
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
  async getProfile(
    @Request() req: { user: Partial<User> & { id?: string; sub?: string } },
  ) {
    const email = (req.user as any)?.email;
    const id =
      (req.user as any)?.id || (req.user as any)?.sub || (req.user as any)?._id;

    // If neither email nor id present, return an explicit error
    if (!email && !id) {
      return { error: MESSAGES.errors.emailMissing };
    }

    const user = email
      ? await this.usersService.findOneByEmail(email)
      : await this.usersService.findOneById(String(id));

    if (!user) {
      return undefined;
    }

    const { username, roles } = user as any;
    return { username, email: (user as any).email, roles };
  }
}
