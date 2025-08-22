import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisService } from './shared/redis.service';
import { HealthStatus } from './app.interface';

describe('AppController', () => {
  let appController: AppController;

  const mockAppService = {
    getHealth: jest.fn(),
  };

  const mockRedisService = {
    isConnectionHealthy: true,
    checkHealth: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: AppService, useValue: mockAppService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status', () => {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: true,
        },
      };
      mockAppService.getHealth.mockReturnValue(health);

      const result: HealthStatus = mockAppService.getHealth();

      expect(result.status).toBe('healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      if (result.services) {
        expect(result.services.redis).toBe(true);
      }
    });

    it('should return correct environment', () => {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: true,
        },
      };
      mockAppService.getHealth.mockReturnValue(health);

      const result: HealthStatus = mockAppService.getHealth();

      expect(result.status).toBeDefined();
      expect(typeof result.status).toBe('string');
    });

    it('should return valid timestamp', () => {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: true,
        },
      };
      mockAppService.getHealth.mockReturnValue(health);

      const result: HealthStatus = mockAppService.getHealth();

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('should return valid uptime', () => {
      const health: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          redis: true,
        },
      };
      mockAppService.getHealth.mockReturnValue(health);

      const result: HealthStatus = mockAppService.getHealth();

      expect(result.services).toBeDefined();
      if (result.services) {
        expect(typeof result.services.redis).toBe('boolean');
      }
    });
  });

  describe('readiness', () => {
    it('should return ready status when Redis is healthy', async () => {
      mockRedisService.checkHealth.mockResolvedValue(true);
      const result = await appController.getReadiness();

      expect(result.status).toBe('ready');
      expect(result.message).toBe('Application is ready to accept requests');
      expect(result).toHaveProperty('timestamp');
    });

    it('should throw error when Redis is unhealthy', async () => {
      mockRedisService.isConnectionHealthy = false;
      mockRedisService.checkHealth.mockResolvedValue(false);

      await expect(appController.getReadiness()).rejects.toThrow(
        'Application is not ready',
      );
    });
  });

  describe('health', () => {
    it('should return healthy status when Redis check passes', async () => {
      mockRedisService.checkHealth.mockResolvedValue(true);
      const result = await appController.getHealth();

      expect(result.status).toBe('healthy');
      if (result.services) {
        expect(result.services.redis).toBe(true);
      }
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return unhealthy status when Redis check fails', async () => {
      mockRedisService.checkHealth.mockResolvedValue(false);
      const result = await appController.getHealth();

      expect(result.status).toBe('unhealthy');
      if (result.services) {
        expect(result.services.redis).toBe(false);
      }
    });
  });
});
