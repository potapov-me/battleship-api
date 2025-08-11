import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;
  let usersService: UsersService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('test-secret');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
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

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isEmailConfirmed: true,
        roles: ['user'],
      };

      mockUsersService.findOneById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(mockUsersService.findOneById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        isEmailConfirmed: true,
        roles: ['user'],
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = {
        email: 'test@example.com',
        sub: 'user-id',
        username: 'testuser',
      };

      mockUsersService.findOneById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException when email not confirmed', async () => {
      const payload = {
        email: 'test@example.com',
        sub: 'user-id',
        username: 'testuser',
      };

      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        isEmailConfirmed: false,
        roles: ['user'],
      };

      mockUsersService.findOneById.mockResolvedValue(mockUser);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith('user-id');
    });

    it('should handle service errors gracefully', async () => {
      const payload = {
        email: 'test@example.com',
        sub: 'user-id',
        username: 'testuser',
      };

      mockUsersService.findOneById.mockRejectedValue(new Error('Database error'));

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith('user-id');
    });
  });
});
