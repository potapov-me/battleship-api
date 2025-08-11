import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { randomBytes } from 'crypto';
import type {
  INotificationService,
  IAuditService,
} from '../shared/interfaces/notification.interface';
import { MESSAGES } from 'src/shared/constants/messages';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('INotificationService')
    private notificationService: INotificationService,
    @Inject('IAuditService') private auditService: IAuditService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    try {
      const user = await this.usersService.findOneByEmail(email);

      if (user && (await bcrypt.compare(password, user.password))) {
        if (!user.isEmailConfirmed) {
          throw new UnauthorizedException(MESSAGES.errors.emailNotConfirmed);
        }

        const { password, ...result } = user;
        await this.auditService.logUserAction(user.id, 'user_login', { email });
        return result;
      }

      return null;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(MESSAGES.errors.unauthorized);
    }
  }

  async login(user: LoginDto): Promise<{ access_token: string }> {
    const userFromDb = await this.usersService.findOneByEmail(user.email);
    if (!userFromDb) {
      throw new UnauthorizedException(MESSAGES.errors.unauthorized);
    }
    const payload: JwtPayload = {
      email: userFromDb.email,
      username: userFromDb.username,
      sub: userFromDb.id,
    };

    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    try {
      // Проверяем, не существует ли уже пользователь с таким email или username
      const existingUserByEmail = await this.usersService.findOneByEmail(email);
      if (existingUserByEmail) {
        throw new ConflictException(MESSAGES.errors.userExistsEmail);
      }

      const existingUserByUsername =
        await this.usersService.findOneByUsername(username);
      if (existingUserByUsername) {
        throw new ConflictException(MESSAGES.errors.userExistsUsername);
      }

      // Создаем нового пользователя
      const newUser = await this.usersService.createUser(
        username,
        email,
        password,
      );

      const confirmToken = randomBytes(20).toString('hex');
      await this.usersService.setEmailConfirmationToken(
        newUser.id,
        confirmToken,
      );

      // Отправляем email подтверждения
      await this.notificationService.sendEmailConfirmation(
        newUser.email,
        confirmToken,
      );

      // Генерируем JWT токен
      const payload: JwtPayload = {
        email: newUser.email,
        username: newUser.username,
        sub: newUser.id,
      };
      const access_token = this.jwtService.sign(payload);

      // Логируем регистрацию
      await this.auditService.logUserAction(newUser.id, 'user_registered', {
        username,
        email,
      });

      // Возвращаем токен и данные пользователя (без пароля)
      const {
        password: _unused,
        id,
        isEmailConfirmed,
        roles,
        ...userWithoutPassword
      } = newUser.toObject();

      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw error;
    }
  }

  async confirmEmail(token: string): Promise<boolean> {
    const user = await this.usersService.confirmEmailByToken(token);
    if (user) {
      await this.auditService.logUserAction(user.id, 'email_confirmed', {
        token,
      });
      return true;
    }
    return false;
  }
}
