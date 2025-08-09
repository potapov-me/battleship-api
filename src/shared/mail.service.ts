import { Injectable } from '@nestjs/common';

export type SentMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  confirmationLink?: string;
};

@Injectable()
export class MailService {
  private lastMail: SentMail | null = null;

  async sendMail(mail: SentMail): Promise<void> {
    const isTestEnv = process.env.NODE_ENV === 'test';
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
