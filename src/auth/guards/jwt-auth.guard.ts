import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MESSAGES } from 'src/shared/constants/messages';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const rawMessage: string | undefined = (info && (info.message || info)) || (err && err.message);
      const isNoToken = rawMessage
        ? /no auth token|no authorization token was found|jwt must be provided/i.test(String(rawMessage))
        : false;
      if (isNoToken) {
        throw new UnauthorizedException('Unauthorized');
      }
      throw new UnauthorizedException(MESSAGES.errors.unauthorized);
    }
    return user;
  }
}


