import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/users/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {}

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async generate_password_hash(password: string): Promise<string> {
    const saltRounds = parseInt(
      this.configService.get<string>('SALT_ROUNDS', '10'),
      10,
    );
    const salt = await bcrypt.genSalt(saltRounds);
    return await bcrypt.hash(password, salt);
  }

  async createUser(
    username: string,
    email: string,
    password: string,
  ): Promise<UserDocument> {
    const hashedPassword = await this.generate_password_hash(password);

    const newUser = new this.userModel({
      username,
      email,
      password: hashedPassword,
      roles: ['user'], // По умолчанию роль пользователя
      isEmailConfirmed: false,
    });

    return await newUser.save();
  }

  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async setEmailConfirmationToken(
    userId: string,
    token: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { emailConfirmationToken: token },
        { new: true },
      )
      .exec();
  }

  async confirmEmailByToken(token: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ emailConfirmationToken: token });
    if (!user) {
      return null;
    }
    user.isEmailConfirmed = true;
    user.emailConfirmationToken = undefined;
    return user.save();
  }
}
