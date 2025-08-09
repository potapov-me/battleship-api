import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { randomBytes } from 'crypto';
import { MailService } from '../shared/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findOneByEmail(email);
    // Проверяем, существует ли пользователь и совпадает ли пароль
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isEmailConfirmed) {
        throw new UnauthorizedException('Email не подтвержден');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: LoginDto): { access_token: string } {
    const payload = {
      email: user.email,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: UserResponseDto }> {
    // Проверяем, не существует ли уже пользователь с таким email или username
    const existingUserByEmail = await this.usersService.findOneByEmail(email);
    if (existingUserByEmail) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const existingUserByUsername =
      await this.usersService.findOneByUsername(username);
    if (existingUserByUsername) {
      throw new Error('Пользователь с таким username уже существует');
    }

    // Создаем нового пользователя
    const newUser = await this.usersService.createUser(
      username,
      email,
      password,
    );

    // Генерируем токен подтверждения email
    const confirmToken = randomBytes(20).toString('hex');
    await this.usersService.setEmailConfirmationToken(newUser.id, confirmToken);

    const confirmation_link = `/auth/confirm-email?token=${confirmToken}`;

    // Отправляем письмо через заглушку
    await this.mailService.sendMail({
      to: newUser.email,
      subject: 'Подтверждение email',
      text: `Для подтверждения перейдите по ссылке: ${confirmation_link}`,
      html: `<p>Для подтверждения перейдите по ссылке: <a href="${confirmation_link}">${confirmation_link}</a></p>`,
      confirmationLink: confirmation_link,
    });

    // Генерируем JWT токен
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = {
      email: newUser.email,
      username: newUser.username,
      sub: newUser.id,
    };
    const access_token = this.jwtService.sign(payload);

    // Возвращаем токен и данные пользователя (без пароля)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _unused, id, isEmailConfirmed, roles, ...userWithoutPassword } = newUser.toObject();

    return {
      access_token,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user: userWithoutPassword,
    };
  }
}
