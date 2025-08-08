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
      password: '$2b$10$Q6q3a6d70fHZQbviNSF2ZOUlg8aXmXqnNiffvLbqdVnAFZFkHdRRa', // Хеш пароля (bcrypt)
      username: 'potapov',
      roles: ['admin'],
    },
  ];

  async findOneByEmail(email: string): Promise<User | undefined> {
    return Promise.resolve(this.users.find((user) => user.email === email));
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
