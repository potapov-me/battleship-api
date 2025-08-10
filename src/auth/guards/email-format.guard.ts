import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { MESSAGES } from 'src/shared/constants/messages';
import isEmail from 'validator/lib/isEmail';

@Injectable()
export class EmailFormatGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const email: unknown = request?.body?.email;

    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException(MESSAGES.errors.invalidEmail);
    }

    const isValid = isEmail(email, {
      allow_display_name: false,
      allow_utf8_local_part: false,
      allow_ip_domain: false,
      domain_specific_validation: true,
      require_tld: true,
    });

    // Дополнительная проверка на двойные точки и допустимые символы
    const strictRegex =
      /^(?!.*\.\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

    if (!isValid || !strictRegex.test(email)) {
      throw new BadRequestException(MESSAGES.errors.invalidEmail);
    }

    return true;
  }
}
