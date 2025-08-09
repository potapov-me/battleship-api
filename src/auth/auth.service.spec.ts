import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../shared/mail.service';

// Мокаем bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findOneByUsername: jest.fn(),
    createUser: jest.fn(),
    setEmailConfirmationToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  } as Partial<MailService> as MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user data when valid credentials are provided', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        roles: ['user'],
        isEmailConfirmed: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as any);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        password,
        hashedPassword,
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
        }),
      );
    });

    it('should return null when user does not exist', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashed_password';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        roles: ['user'],
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as any);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBeNull();
    });

    it('should return null when bcrypt comparison fails', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';

      const mockUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        roles: ['user'],
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as any);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBeNull();
    });

    it('should handle user with admin role', async () => {
      const email = 'admin@example.com';
      const password = 'adminpass';
      const hashedPassword = 'hashed_admin_password';

      const mockAdminUser = {
        id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        roles: ['admin', 'user'],
        isEmailConfirmed: true,
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockAdminUser);
      mockedBcrypt.compare.mockResolvedValue(true as any);

      const result = await service.validateUser(email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toEqual(
        expect.objectContaining({
          id: 'admin-id',
          username: 'admin',
          email: 'admin@example.com',
          roles: ['admin', 'user'],
        }),
      );
    });
  });

  describe('login', () => {
    it('should return access token for valid user', () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedToken = 'jwt_token_123';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(result).toEqual({
        access_token: expectedToken,
      });
    });

    it('should return access token for admin user', () => {
      const loginDto = {
        email: 'admin@example.com',
        password: 'adminpass',
      };

      const expectedToken = 'admin_jwt_token_456';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(result).toEqual({
        access_token: expectedToken,
      });
    });

    it('should handle user with minimal data', () => {
      const loginDto = {
        email: 'minimal@example.com',
        password: 'minimalpass',
      };

      const expectedToken = 'minimal_jwt_token_789';
      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(result).toEqual({
        access_token: expectedToken,
      });
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const username = 'newuser';
      const email = 'new@example.com';
      const password = 'newpassword123';

      const mockCreatedUser = {
        id: 'new-user-id',
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashed_password',
        roles: ['user'],
        toObject: jest.fn().mockReturnValue({
          id: 'new-user-id',
          username: 'newuser',
          email: 'new@example.com',
          password: 'hashed_password',
          roles: ['user'],
        }),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('new_jwt_token');

      const result = await service.register(username, email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(username, email, password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: email,
        username: 'newuser',
        sub: 'new-user-id',
      });
      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'new_jwt_token',
          user: {
            id: 'new-user-id',
            username: 'newuser',
            email: 'new@example.com',
            roles: ['user'],
          },
        }),
      );
    });

    it('should throw error when user with email already exists', async () => {
      const username = 'newuser';
      const email = 'existing@example.com';
      const password = 'newpassword123';

      const existingUser = {
        id: 'existing-id',
        username: 'existinguser',
        email: 'existing@example.com',
        roles: ['user'],
      };

      mockUsersService.findOneByEmail.mockResolvedValue(existingUser);

      await expect(service.register(username, email, password)).rejects.toThrow(
        'Пользователь с таким email уже существует'
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).not.toHaveBeenCalled();
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should throw error when user with username already exists', async () => {
      const username = 'existinguser';
      const email = 'new@example.com';
      const password = 'newpassword123';

      const existingUser = {
        id: 'existing-id',
        username: 'existinguser',
        email: 'different@example.com',
        roles: ['user'],
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(existingUser);

      await expect(service.register(username, email, password)).rejects.toThrow(
        'Пользователь с таким username уже существует'
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should handle special characters in username during registration', async () => {
      const username = 'test_user-123';
      const email = 'special@example.com';
      const password = 'newpassword123';

      const mockCreatedUser = {
        id: 'special-user-id',
        username: 'test_user-123',
        email: 'special@example.com',
        password: 'hashed_password',
        roles: ['user'],
        toObject: jest.fn().mockReturnValue({
          id: 'special-user-id',
          username: 'test_user-123',
          email: 'special@example.com',
          password: 'hashed_password',
          roles: ['user'],
        }),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('special_jwt_token');

      const result = await service.register(username, email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(username, email, password);
      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'special_jwt_token',
          user: {
            id: 'special-user-id',
            username: 'test_user-123',
            email: 'special@example.com',
            roles: ['user'],
          },
        }),
      );
    });

    it('should handle long password during registration', async () => {
      const username = 'longpassuser';
      const email = 'longpass@example.com';
      const password = 'very_long_password_with_many_characters_123!@#$%^&*()';

      const mockCreatedUser = {
        id: 'longpass-user-id',
        username: 'longpassuser',
        email: 'longpass@example.com',
        password: 'hashed_long_password',
        roles: ['user'],
        toObject: jest.fn().mockReturnValue({
          id: 'longpass-user-id',
          username: 'longpassuser',
          email: 'longpass@example.com',
          password: 'hashed_long_password',
          roles: ['user'],
        }),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValue('longpass_jwt_token');

      const result = await service.register(username, email, password);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(username, email, password);
      expect(result).toEqual(
        expect.objectContaining({
          access_token: 'longpass_jwt_token',
          user: {
            id: 'longpass-user-id',
            username: 'longpassuser',
            email: 'longpass@example.com',
            roles: ['user'],
          },
        }),
      );
    });

    it('should handle database errors during user creation', async () => {
      const username = 'erroruser';
      const email = 'error@example.com';
      const password = 'errorpassword123';

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.createUser.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.register(username, email, password)).rejects.toThrow(
        'Database connection failed'
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(username, email, password);
    });

    it('should handle JWT signing errors', async () => {
      const username = 'jwtuser';
      const email = 'jwt@example.com';
      const password = 'jwtpassword123';

      const mockCreatedUser = {
        id: 'jwt-user-id',
        username: 'jwtuser',
        email: 'jwt@example.com',
        password: 'hashed_password',
        roles: ['user'],
        toObject: jest.fn().mockReturnValue({
          id: 'jwt-user-id',
          username: 'jwtuser',
          email: 'jwt@example.com',
          password: 'hashed_password',
          roles: ['user'],
        }),
      };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.findOneByUsername.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.register(username, email, password)).rejects.toThrow(
        'JWT signing failed'
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.findOneByUsername).toHaveBeenCalledWith(username);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(username, email, password);
    });
  });
});
