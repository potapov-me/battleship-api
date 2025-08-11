import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const password = configService.get<string>('REDIS_PASSWORD');
        const hasPassword = typeof password === 'string' && password.length > 0;
        const redis = new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: hasPassword ? password : undefined,
          db: configService.get<number>('REDIS_DB', 0),
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
          connectTimeout: 10000,
          family: 4,
        });

        const isTest = configService.get<string>('NODE_ENV') === 'test';
        const safeLog = (msg: string, ...args: unknown[]) => {
          if (!isTest) console.log(msg, ...args);
        };
        const safeError = (msg: string, ...args: unknown[]) => {
          if (!isTest) console.error(msg, ...args);
        };

        redis.on('connect', () => {
          safeLog('Redis connected successfully!');
        });

        redis.on('ready', () => {
          safeLog('Redis is ready to accept commands');
        });

        redis.on('error', (err) => {
          safeError('Redis connection error:', err);
        });

        redis.on('close', () => {
          safeLog('Redis connection closed');
        });

        redis.on('reconnecting', () => {
          safeLog('Redis reconnecting...');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_CLUSTER',
      useFactory: (configService: ConfigService) => {
        // Для production можно использовать Redis Cluster
        const clusterEnabled = configService.get<boolean>('REDIS_CLUSTER_ENABLED', false);
        
        if (clusterEnabled) {
          const password = configService.get<string>('REDIS_PASSWORD');
          const hasPassword = typeof password === 'string' && password.length > 0;
          const cluster = new Cluster([
            {
              host: configService.get<string>('REDIS_HOST', 'localhost'),
              port: configService.get<number>('REDIS_PORT', 6379),
            }
          ], {
            redisOptions: {
              password: hasPassword ? password : undefined,
              lazyConnect: true,
              maxRetriesPerRequest: 3,
            },
            clusterRetryStrategy: (times) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
            },
          });

          cluster.on('connect', () => {
            console.log('Redis Cluster connected successfully!');
          });

          cluster.on('error', (err) => {
            console.error('Redis Cluster error:', err);
          });

          return cluster;
        }
        
        return null;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_CLUSTER'],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('REDIS_CLUSTER') private readonly cluster: Cluster | null,
  ) {}

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      if (this.cluster) {
        await this.cluster.quit();
      }
      // Avoid verbose logging in tests
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV !== 'test') {
        console.log('Redis connections closed gracefully');
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error closing Redis connections:', error);
      }
    }
  }
}
