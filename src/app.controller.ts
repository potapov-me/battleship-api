import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './shared/redis.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      redis: boolean;
    };
  }> {
    const redisHealth = await this.redisService.checkHealth();

    return {
      status: redisHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealth,
      },
    };
  }

  @Get('ready')
  async getReadiness(): Promise<{
    status: string;
    timestamp: string;
    message: string;
  }> {
    // Активно проверяем состояние Redis на каждый запрос готовности
    const redisHealth = await this.redisService.checkHealth();

    if (!redisHealth) {
      this.logger.warn(
        'Application is not ready: Redis connection is unhealthy',
      );
      throw new ServiceUnavailableException('Application is not ready');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Application is ready to accept requests',
    };
  }
}
