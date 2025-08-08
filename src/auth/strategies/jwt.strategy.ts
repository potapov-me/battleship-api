import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Для использования .env
import { User } from 'src/users/models/user.models';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'SECRET_KEY',
    });
  }

  validate(
    payload: JwtPayload,
  ): Pick<User, 'id' | 'email' | 'username' | 'roles'> | undefined {
    return {
      id: Number(payload.sub),
      email: payload.email,
      username: payload.username,
      roles: ['user'],
    };
  }
}
