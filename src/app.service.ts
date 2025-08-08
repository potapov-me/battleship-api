import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity'; // убедитесь, что у вас есть сущность User
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(username: string, email: string): Promise<User> {
    const user = this.userRepository.create({ username, email });
    return await this.userRepository.save(user);
  }
}
