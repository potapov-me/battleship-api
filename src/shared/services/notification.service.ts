import { Injectable, Logger } from '@nestjs/common';
import { INotificationService } from '../interfaces/notification.interface';
import { MailService } from '../mail.service';
import { ConfigService } from '@nestjs/config';
import { MESSAGES } from '../constants/messages';

@Injectable()
export class NotificationService implements INotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    try {
      await this.mailService.sendMail({
        to,
        subject,
        text: content,
        html: this.convertToHtml(content),
      });
      
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendEmailConfirmation(to: string, token: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN', 'http://localhost:3000');
    const confirmationLink = `${domain}/auth/confirm-email?token=${token}`;

    await this.sendEmail(
      to,
      MESSAGES.auth.confirmEmail.subject,
      MESSAGES.auth.confirmEmail.text(confirmationLink)
    );
  }

  async sendGameInvitation(to: string, gameId: string, inviterName: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN', 'http://localhost:3000');
    const gameLink = `${domain}/game/${gameId}`;

    const subject = 'Приглашение в игру Морской бой';
    const content = `Привет! ${inviterName} приглашает вас сыграть в Морской бой. 
    
    Перейдите по ссылке, чтобы присоединиться к игре: ${gameLink}
    
    Удачной игры!`;

    await this.sendEmail(to, subject, content);
  }

  async sendGameUpdate(to: string, gameId: string, update: string): Promise<void> {
    const domain = this.configService.get<string>('DOMAIN', 'http://localhost:3000');
    const gameLink = `${domain}/game/${gameId}`;

    const subject = 'Обновление игры Морской бой';
    const content = `Обновление в игре: ${update}
    
    Перейдите по ссылке, чтобы посмотреть игру: ${gameLink}`;

    await this.sendEmail(to, subject, content);
  }

  private convertToHtml(text: string): string {
    return text
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }
}
