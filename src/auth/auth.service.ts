import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDto | null> {
    const user = await this.usersService.findOneByEmail(email);
    // Проверяем, существует ли пользователь и совпадает ли пароль
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(user: UserDto): { access_token: string } {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<{ access_token: string; user: UserDto }> {
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

    // Генерируем JWT токен
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = { email: newUser.email, sub: newUser.id };
    const access_token = this.jwtService.sign(payload);

    // Возвращаем токен и данные пользователя (без пароля)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _unused, ...userWithoutPassword } = newUser.toObject();

    return {
      access_token,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      user: userWithoutPassword,
    };
  }
}
