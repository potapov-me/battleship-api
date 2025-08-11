import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected getTracker(req: Record<string, any>): Promise<string> {
    try {
      // Приоритет: X-Forwarded-For (для прокси), затем IP, затем user ID
      let identifier = 'unknown';
      
      if (req.headers['x-forwarded-for']) {
        identifier = req.headers['x-forwarded-for'].split(',')[0].trim();
      } else if (req.ips && req.ips.length > 0) {
        identifier = req.ips[0];
      } else if (req.ip) {
        identifier = req.ip;
      }
      
      // Если есть аутентифицированный пользователь, добавляем его ID
      if (req.user?.id) {
        identifier = `${identifier}:user:${req.user.id}`;
      }
      
      return Promise.resolve(identifier);
    } catch (error) {
      this.logger.warn('Failed to get tracker identifier, using fallback', error);
      return Promise.resolve(req.ip || 'unknown');
    }
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    try {
      const result = await super.handleRequest(requestProps);
      
      if (!result) {
        const request = requestProps.context.switchToHttp().getRequest();
        const identifier = await this.getTracker(request);
        
        this.logger.warn(
          `Rate limit exceeded for ${identifier}: ${request.method} ${request.url}`,
        );
      }
      
      return result;
    } catch (error) {
      this.logger.error('Error in rate limit guard:', error);
      // В случае ошибки разрешаем запрос
      return true;
    }
  }
}
