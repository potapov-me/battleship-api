import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentMail } from 'src/shared/interfaces/mail.interface';
import { MESSAGES } from './constants/messages';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  private lastMail: SentMail | null = null;

  async sendMail(mail: SentMail): Promise<void> {
    const isTestEnv = this.configService.get<string>('NODE_ENV') === 'test';

    // Build absolute confirmation link if provided, using DOMAIN
    const domainFromConfig = this.configService.get<string>('DOMAIN') || '';
    const normalizedDomain = domainFromConfig.replace(/\/$/, '');

    if (mail.confirmationLink) {
      const isAbsolute = /^(http|https):\/\//i.test(mail.confirmationLink);
      const absoluteLink = isAbsolute
        ? mail.confirmationLink
        : `${normalizedDomain}${mail.confirmationLink.startsWith('/') ? '' : '/'}${mail.confirmationLink}`;

      const subject = mail.subject || MESSAGES.auth.confirmEmail.subject;
      const text = MESSAGES.auth.confirmEmail.text(absoluteLink);
      const html = MESSAGES.auth.confirmEmail.html(absoluteLink);

      mail = { ...mail, subject, text, html, confirmationLink: absoluteLink };
    }

    if (!isTestEnv) {
      console.log(mail);
    }

    this.lastMail = mail;
  }

  getLastMail(): SentMail | null {
    return this.lastMail;
  }

  clear(): void {
    this.lastMail = null;
  }
}
