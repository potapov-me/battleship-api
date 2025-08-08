import { Test, TestingModule } from '@nestjs/testing';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user when valid credentials are provided', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'wrongpassword';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should return admin user when valid admin credentials are provided', async () => {
      const email = 'admin@example.com';
      const password = 'adminpass';

      const mockAdminUser = {
        id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        roles: ['admin', 'user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockAdminUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockAdminUser);
    });

    it('should handle user with minimal data', async () => {
      const email = 'minimal@example.com';
      const password = 'minimalpass';

      const mockMinimalUser = {
        id: 'minimal-id',
        email: 'minimal@example.com',
      };

      mockAuthService.validateUser.mockResolvedValue(mockMinimalUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockMinimalUser);
    });

    it('should handle empty email', async () => {
      const email = '';
      const password = 'password123';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle empty password', async () => {
      const email = 'test@example.com';
      const password = '';

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle special characters in email', async () => {
      const email = 'test+tag@example.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test+tag@example.com',
        roles: ['user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should handle special characters in password', async () => {
      const email = 'test@example.com';
      const password = 'ComplexP@ssw0rd!123';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should handle auth service errors', async () => {
      const email = 'error@example.com';
      const password = 'password123';

      const errorMessage = 'Authentication service error';
      mockAuthService.validateUser.mockRejectedValue(new Error(errorMessage));

      await expect(strategy.validate(email, password)).rejects.toThrow(errorMessage);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should handle very long email', async () => {
      const email = 'very.long.email.address.with.many.subdomains@very.long.domain.name.example.com';
      const password = 'password123';

      const mockUser = {
        id: 'user-id',
        username: 'longemailuser',
        email: 'very.long.email.address.with.many.subdomains@very.long.domain.name.example.com',
        roles: ['user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should handle very long password', async () => {
      const email = 'test@example.com';
      const password = 'very_long_password_with_many_characters_123!@#$%^&*()_+-=[]{}|;:,.<>?';

      const mockUser = {
        id: 'user-id',
        username: 'longpassuser',
        email: 'test@example.com',
        roles: ['user'],
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });
  });
});
