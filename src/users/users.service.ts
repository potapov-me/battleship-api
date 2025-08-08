import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from './models/user.models';

@Injectable()
export class UsersService {
  constructor(private configService: ConfigService) {}

  private readonly users: User[] = [
    {
      id: 1,
      email: 'constantin@potapov.me',
      password: '$2b$10$2gveH4tPh.tv3oKuRkY76.GXHNA6AO2FOXu5c9baylCSuyBWMyip.', // Хеш пароля (bcrypt)
      username: 'potapov',
      createdAt: new Date('2023-01-01T00:00:00Z'),
    },
  ];

  findOneByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  async generate_password_hash(password: string): Promise<string> {
    const saltRounds = parseInt(
      this.configService.get<string>('SALT_ROUNDS', '10'),
      10,
    );
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }
}
