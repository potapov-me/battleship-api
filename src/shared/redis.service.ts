import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  isConnectionHealthy = false;

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async onModuleInit() {
    await this.checkHealth();
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.redis.ping();
      this.isConnectionHealthy = true;
      if (response !== 'PONG') {
        this.logger.warn('Redis ping returned unexpected response:', response);
      }
      return true;
    } catch (error) {
      this.isConnectionHealthy = false;
      // Лаконичный лог, без стека, чтобы не засорять логи при частых проверках
      this.logger.warn(`Redis health check failed: ${error?.message ?? error}`);
      return false;
    }
  }

  

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      // Используем scan вместо keys для production
      if (process.env.NODE_ENV === 'production') {
        return await this.scanKeys(pattern);
      }
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get keys with pattern ${pattern}:`, error);
      return [];
    }
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');
    
    return keys;
  }

  async hset(key: string, field: string, value: any): Promise<void> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.hset(key, field, serializedValue);
    } catch (error) {
      this.logger.error(`Failed to hset key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const value = await this.redis.hget(key, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to hget key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value) as T;
        } catch (parseError) {
          // Skip invalid JSON
          this.logger.warn(
            `Invalid JSON for field ${field} in key ${key}: ${parseError}`,
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to hgetall key ${key}:`, error);
      return {};
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      await this.redis.hdel(key, field);
    } catch (error) {
      this.logger.error(`Failed to hdel key ${key}, field ${field}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      await this.redis.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Failed to set expire for key ${key}:`, error);
      throw error;
    }
  }

  // Новые методы для кэширования
  async getCached<T>(key: string, fallback: () => Promise<T>, ttl: number = 3600): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    } catch (error) {
      this.logger.warn(`Failed to get cached value for ${key}:`, error);
    }

    try {
      const fresh = await fallback();
      await this.set(key, fresh, ttl);
      return fresh;
    } catch (error) {
      this.logger.error(`Failed to execute fallback for ${key}:`, error);
      throw error;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate pattern ${pattern}:`, error);
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      return await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Failed to sadd key ${key}:`, error);
      throw error;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      return await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Failed to srem key ${key}:`, error);
      throw error;
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Failed to smembers key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    if (!this.isConnectionHealthy) {
      throw new Error('Redis connection is not healthy');
    }

    try {
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to sismember key ${key}, member ${member}:`, error);
      return false;
    }
  }
}
