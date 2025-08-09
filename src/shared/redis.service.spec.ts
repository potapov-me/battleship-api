import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: jest.Mocked<Redis>;

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
    } as any;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
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

      expect(mockRedis.setex).toHaveBeenCalledWith(key, ttl, JSON.stringify(value));
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('should handle Redis errors', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      const error = new Error('Redis connection failed');

      mockRedis.set.mockRejectedValue(error);

      await expect(service.set(key, value)).rejects.toThrow('Redis connection failed');
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

      mockRedis.get.mockRejectedValue(error);

      const result = await service.get(key);

      expect(result).toBeNull();
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

      mockRedis.del.mockRejectedValue(error);

      await expect(service.del(key)).rejects.toThrow('Redis connection failed');
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

      mockRedis.exists.mockRejectedValue(error);

      const result = await service.exists(key);

      expect(result).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return keys matching pattern', async () => {
      const pattern = 'test:*';
      const keys = ['test:1', 'test:2', 'test:3'];

      mockRedis.keys.mockResolvedValue(keys);

      const result = await service.keys(pattern);

      expect(result).toEqual(keys);
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
    });

    it('should handle Redis errors', async () => {
      const pattern = 'test:*';
      const error = new Error('Redis connection failed');

      mockRedis.keys.mockRejectedValue(error);

      const result = await service.keys(pattern);

      expect(result).toEqual([]);
    });
  });

  describe('hset', () => {
    it('should set a hash field successfully', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = { test: 'data' };

      mockRedis.hset.mockResolvedValue(1);

      await service.hset(key, field, value);

      expect(mockRedis.hset).toHaveBeenCalledWith(key, field, JSON.stringify(value));
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const field = 'test-field';
      const value = { test: 'data' };
      const error = new Error('Redis connection failed');

      mockRedis.hset.mockRejectedValue(error);

      await expect(service.hset(key, field, value)).rejects.toThrow('Redis connection failed');
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

      mockRedis.hget.mockRejectedValue(error);

      const result = await service.hget(key, field);

      expect(result).toBeNull();
    });
  });

  describe('hgetall', () => {
    it('should get all hash fields successfully', async () => {
      const key = 'test-hash';
      const hash = {
        field1: JSON.stringify({ data: 'value1' }),
        field2: JSON.stringify({ data: 'value2' }),
      };

      mockRedis.hgetall.mockResolvedValue(hash);

      const result = await service.hgetall(key);

      expect(result).toEqual({
        field1: { data: 'value1' },
        field2: { data: 'value2' },
      });
      expect(mockRedis.hgetall).toHaveBeenCalledWith(key);
    });

    it('should handle invalid JSON in hash fields', async () => {
      const key = 'test-hash';
      const hash = {
        field1: JSON.stringify({ data: 'value1' }),
        field2: 'invalid-json',
      };

      mockRedis.hgetall.mockResolvedValue(hash);

      const result = await service.hgetall(key);

      expect(result).toEqual({
        field1: { data: 'value1' },
      });
    });

    it('should handle Redis errors', async () => {
      const key = 'test-hash';
      const error = new Error('Redis connection failed');

      mockRedis.hgetall.mockRejectedValue(error);

      const result = await service.hgetall(key);

      expect(result).toEqual({});
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

      mockRedis.hdel.mockRejectedValue(error);

      await expect(service.hdel(key, field)).rejects.toThrow('Redis connection failed');
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

      mockRedis.expire.mockRejectedValue(error);

      await expect(service.expire(key, seconds)).rejects.toThrow('Redis connection failed');
    });
  });
});
