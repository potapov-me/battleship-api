import { Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password as string, 10);
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password_hash: hashedPassword,
    });
    return { id: user.id };
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email); // Поиск в PostgreSQL
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user; // Исключаем пароль из результата
      return result;
    }
    return null;
  }
}
