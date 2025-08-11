import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { MESSAGES } from '../../shared/constants/messages';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      algorithms: ['HS256'],
      issuer: configService.get<string>('JWT_ISSUER', 'battleship-api'),
      audience: configService.get<string>('JWT_AUDIENCE', 'battleship-client'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      // Проверяем, что пользователь существует и активен
      const user = await this.usersService.findOneById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException(MESSAGES.errors.userNotFound);
      }

      if (!user.isEmailConfirmed) {
        throw new UnauthorizedException(MESSAGES.errors.emailNotConfirmed);
      }

      // Возвращаем пользователя без пароля (plain object)
      const plainUser = typeof (user as any).toObject === 'function' ? (user as any).toObject() : (user as any);
      const { password, ...result } = plainUser;
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(MESSAGES.errors.unauthorized);
    }
  }
}
