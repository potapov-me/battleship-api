import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data when valid payload is provided', async () => {
      const payload = {
        email: 'test@example.com',
        sub: 'user-id',
        username: 'testuser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['user'],
      });
    });

    it('should return user data when payload has minimal data', async () => {
      const payload = {
        email: 'minimal@example.com',
        sub: 'minimal-id',
        username: 'minimaluser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'minimal-id',
        email: 'minimal@example.com',
        username: 'minimaluser',
        roles: ['user'],
      });
    });

    it('should return user data for admin payload', async () => {
      const payload = {
        email: 'admin@example.com',
        sub: 'admin-id',
        username: 'admin',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'admin-id',
        email: 'admin@example.com',
        username: 'admin',
        roles: ['user'],
      });
    });

    it('should handle payload with empty email', async () => {
      const payload = {
        email: '',
        sub: 'empty-email-id',
        username: 'emptyuser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'empty-email-id',
        email: '',
        username: 'emptyuser',
        roles: ['user'],
      });
    });

    it('should handle payload without email', async () => {
      const payload = {
        sub: 'no-email-id',
        username: 'noemailuser',
      } as any;

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'no-email-id',
        email: undefined,
        username: 'noemailuser',
        roles: ['user'],
      });
    });

    it('should handle payload with special characters in email', async () => {
      const payload = {
        email: 'test+tag@example.com',
        sub: 'special-id',
        username: 'specialuser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'special-id',
        email: 'test+tag@example.com',
        username: 'specialuser',
        roles: ['user'],
      });
    });

    it('should handle payload with very long email', async () => {
      const payload = {
        email: 'very.long.email.address.with.many.subdomains@very.long.domain.name.example.com',
        sub: 'longemail-id',
        username: 'longemailuser',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'longemail-id',
        email: 'very.long.email.address.with.many.subdomains@very.long.domain.name.example.com',
        username: 'longemailuser',
        roles: ['user'],
      });
    });

    it('should handle payload with special characters in username', async () => {
      const payload = {
        email: 'special@example.com',
        sub: 'specialuser-id',
        username: 'test_user-123',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 'specialuser-id',
        email: 'special@example.com',
        username: 'test_user-123',
        roles: ['user'],
      });
    });
  });
});
