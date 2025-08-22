import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockRedis = {
      set: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      hset: jest.fn(),
      hget: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      expire: jest.fn(),
      sadd: jest.fn(),
      srem: jest.fn(),
      smembers: jest.fn(),
      sismember: jest.fn(),
      scan: jest.fn(),
      ping: jest.fn(),
      quit: jest.fn(),
    } as any;

    // Мокаем Logger для каждого теста
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(mockLogger.warn);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Мокаем успешное подключение к Redis
    service.isConnectionHealthy = true;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should set a value without TTL', async () => {
      const key = 'test-key';
      const value = { test: 'data' };

      mockRedis.set.mockResolvedValue('OK');

      await service.set(key, value);

      expect(mockRedis.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should set a value with TTL', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      const ttl = 3600;

      mockRedis.setex.mockResolvedValue('OK');

      await service.set(key, value, ttl);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        key,
        ttl,
        JSON.stringify(value),
      );
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.set(key, value)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('get', () => {
    it('should get a value successfully', async () => {
      const key = 'test-key';
      const value = { test: 'data' };

      mockRedis.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(mockRedis.get).toHaveBeenCalledWith(key);
    });

    it('should return null for non-existent key', async () => {
      const key = 'non-existent';

      mockRedis.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const key = 'test-key';

      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.get(key)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('del', () => {
    it('should delete a key successfully', async () => {
      const key = 'test-key';

      mockRedis.del.mockResolvedValue(1);

      await service.del(key);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.del(key)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      const key = 'test-key';

      mockRedis.exists.mockResolvedValue(1);

      const result = await service.exists(key);

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(key);
    });

    it('should return false for non-existent key', async () => {
      const key = 'non-existent';

      mockRedis.exists.mockResolvedValue(0);

      const result = await service.exists(key);

      expect(result).toBe(false);
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.exists(key)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('keys', () => {
    it('should return keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2'];

      mockRedis.keys.mockResolvedValue(keys);

      const result = await service.keys(pattern);

      expect(result).toEqual(keys);
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
    });

    it('should handle Redis errors', async () => {
      const pattern = 'test:*';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.keys(pattern)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('hset', () => {
    it('should set a hash field successfully', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = { test: 'data' };

      mockRedis.hset.mockResolvedValue(1);

      await service.hset(key, field, value);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        key,
        field,
        JSON.stringify(value),
      );
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = { test: 'data' };
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.hset(key, field, value)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('hget', () => {
    it('should get a hash field successfully', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = { test: 'data' };

      mockRedis.hget.mockResolvedValue(JSON.stringify(value));

      const result = await service.hget(key, field);

      expect(result).toEqual(value);
      expect(mockRedis.hget).toHaveBeenCalledWith(key, field);
    });

    it('should return null for non-existent field', async () => {
      const key = 'test-hash';
      const field = 'non-existent';

      mockRedis.hget.mockResolvedValue(null);

      const result = await service.hget(key, field);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const key = 'test-hash';
      const field = 'test-field';

      mockRedis.hget.mockResolvedValue('invalid-json');

      const result = await service.hget(key, field);

      expect(result).toBeNull();
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.hget(key, field)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('hgetall', () => {
    it('should get all hash fields successfully', async () => {
      const key = 'test-hash';
      const hashData = {
        field1: JSON.stringify({ test: 'data1' }),
        field2: JSON.stringify({ test: 'data2' }),
      };

      mockRedis.hgetall.mockResolvedValue(hashData);

      const result = await service.hgetall(key);

      expect(result).toEqual({
        field1: { test: 'data1' },
        field2: { test: 'data2' },
      });
      expect(mockRedis.hgetall).toHaveBeenCalledWith(key);
    });

    it('should handle invalid JSON in hash fields', async () => {
      const key = 'test-hash';
      const hashData = {
        field1: JSON.stringify({ test: 'data1' }),
        field2: 'invalid-json',
      };

      mockRedis.hgetall.mockResolvedValue(hashData);

      const result = await service.hgetall(key);

      expect(result.field1).toEqual({ test: 'data1' });
      expect(result.field2).toBeUndefined(); // Invalid JSON fields are skipped
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.hgetall(key)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('hdel', () => {
    it('should delete a hash field successfully', async () => {
      const key = 'test-hash';
      const field = 'test-field';

      mockRedis.hdel.mockResolvedValue(1);

      await service.hdel(key, field);

      expect(mockRedis.hdel).toHaveBeenCalledWith(key, field);
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.hdel(key, field)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('expire', () => {
    it('should set expiration for a key successfully', async () => {
      const key = 'test-key';
      const seconds = 3600;

      mockRedis.expire.mockResolvedValue(1);

      await service.expire(key, seconds);

      expect(mockRedis.expire).toHaveBeenCalledWith(key, seconds);
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const seconds = 3600;
      const error = new Error('Redis connection failed');

      service.isConnectionHealthy = false;

      await expect(service.expire(key, seconds)).rejects.toThrow(
        'Redis connection is not healthy',
      );
    });
  });

  describe('Redis Set operations', () => {
    it('should add member to set', async () => {
      const key = 'test-set';
      const member = 'test-member';

      mockRedis.sadd.mockResolvedValue(1);

      await service.sadd(key, member);

      expect(mockRedis.sadd).toHaveBeenCalledWith(key, member);
    });

    it('should remove member from set', async () => {
      const key = 'test-set';
      const member = 'test-member';

      mockRedis.srem.mockResolvedValue(1);

      await service.srem(key, member);

      expect(mockRedis.srem).toHaveBeenCalledWith(key, member);
    });

    it('should get all members of set', async () => {
      const key = 'test-set';
      const members = ['member1', 'member2'];

      mockRedis.smembers.mockResolvedValue(members);

      const result = await service.smembers(key);

      expect(result).toEqual(members);
      expect(mockRedis.smembers).toHaveBeenCalledWith(key);
    });

    it('should check if member exists in set', async () => {
      const key = 'test-set';
      const member = 'test-member';

      mockRedis.sismember.mockResolvedValue(1);

      const result = await service.sismember(key, member);

      expect(result).toBe(true);
      expect(mockRedis.sismember).toHaveBeenCalledWith(key, member);
    });
  });

  describe('getCached', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-cache';
      const cachedValue = { test: 'cached' };
      const fallback = jest.fn();

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedValue));

      const result = await service.getCached(key, fallback, 3600);

      expect(result).toEqual(cachedValue);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should call fallback if cache miss', async () => {
      const key = 'test-cache';
      const fallbackValue = { test: 'fallback' };
      const fallback = jest.fn().mockResolvedValue(fallbackValue);

      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.getCached(key, fallback, 3600);

      expect(result).toEqual(fallbackValue);
      expect(fallback).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalledWith(
        key,
        3600,
        JSON.stringify(fallbackValue),
      );
    });
  });

  describe('invalidatePattern', () => {
    it('should delete keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2'];

      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(2);

      await service.invalidatePattern(pattern);

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });
  });

  describe('health check', () => {
    it('should check Redis health successfully', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const result = await service.checkHealth();

      expect(mockRedis.ping).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle health check failure', async () => {
      const error = new Error('Connection failed');
      mockRedis.ping.mockRejectedValue(error);

      const result = await service.checkHealth();

      expect(mockRedis.ping).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
