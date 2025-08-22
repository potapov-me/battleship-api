import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { MESSAGES } from 'src/shared/constants/messages';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findOneById: jest.fn(),
    findOneByUsername: jest.fn(),
    generate_password_hash: jest.fn(),
    createUser: jest.fn(),
    confirmEmailByToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token for valid user', async () => {
      const loginDto = {
        email: 'test@test.com',
        password: 'password123',
      };
      const expectedToken = { access_token: 'test_token' };
      (authService.login as jest.Mock).mockResolvedValue(expectedToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedToken);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login with different user roles', async () => {
      const loginDto = {
        email: 'admin@test.com',
        password: 'adminpass',
      };
      const expectedToken = { access_token: 'admin_token' };
      (authService.login as jest.Mock).mockResolvedValue(expectedToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedToken);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle login with minimal user data', async () => {
      const loginDto = {
        email: 'minimal@test.com',
        password: 'minimalpass',
      };
      const expectedToken = { access_token: 'minimal_token' };
      (authService.login as jest.Mock).mockResolvedValue(expectedToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedToken);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'test@example.com',
          roles: ['user'],
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException for existing email', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'existing@example.com',
        password: 'Password123',
      };

      const errorMessage = 'Пользователь с таким email уже существует';
      mockAuthService.register.mockRejectedValue(
        new ConflictException(errorMessage),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
    });

    it('should throw ConflictException for existing username', async () => {
      const registerDto: RegisterDto = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'Password123',
      };

      const errorMessage = 'Пользователь с таким username уже существует';
      mockAuthService.register.mockRejectedValue(
        new ConflictException(errorMessage),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
    });

    it('should handle registration with special characters in username', async () => {
      const registerDto: RegisterDto = {
        username: 'test_user-123',
        email: 'special@example.com',
        password: 'Password123',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          username: 'test_user-123',
          email: 'special@example.com',
          roles: ['user'],
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle registration with long password', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'longpass@example.com',
        password: 'VeryLongPasswordWithManyCharacters123!@#',
      };

      const expectedResult = {
        access_token: 'jwt-token',
        user: {
          id: 'user-id',
          username: 'testuser',
          email: 'longpass@example.com',
          roles: ['user'],
        },
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.username,
        registerDto.email,
        registerDto.password,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email with valid token', async () => {
      const token = 'valid-token';
      const confirmedUser = {
        id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        isEmailConfirmed: true,
      };

      mockUsersService.confirmEmailByToken.mockResolvedValue(confirmedUser);

      const result = await controller.confirmEmail(token);

      expect(mockUsersService.confirmEmailByToken).toHaveBeenCalledWith(token);
      expect(result).toEqual({ message: MESSAGES.auth.confirmEmail.success });
    });

    it('should return error for missing token', async () => {
      const result = await controller.confirmEmail();

      expect(result).toEqual({ error: MESSAGES.errors.tokenRequired });
      expect(mockUsersService.confirmEmailByToken).not.toHaveBeenCalled();
    });

    it('should return error for invalid token', async () => {
      const token = 'invalid-token';

      mockUsersService.confirmEmailByToken.mockResolvedValue(null);

      const result = await controller.confirmEmail(token);

      expect(mockUsersService.confirmEmailByToken).toHaveBeenCalledWith(token);
      expect(result).toEqual({ error: MESSAGES.errors.invalidOrExpiredToken });
    });
  });

  describe('getProfile', () => {
    it('should return the user profile for valid user', async () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
        password: 'hashedpassword',
      } as any;
      const reqUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      } as any;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      const result = await controller.getProfile({ user: reqUser });

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      });
    });

    it('should return user profile for admin user', async () => {
      const adminUser = {
        _id: '507f1f77bcf86cd799439012',
        id: '507f1f77bcf86cd799439012',
        username: 'admin',
        email: 'admin@test.com',
        roles: ['admin', 'user'],
        password: 'hashedpassword',
      } as any;
      const reqUser = {
        _id: '507f1f77bcf86cd799439012',
        id: '507f1f77bcf86cd799439012',
        username: 'admin',
        email: 'admin@test.com',
        roles: ['admin', 'user'],
      } as any;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(adminUser);
      const result = await controller.getProfile({ user: reqUser });

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        'admin@test.com',
      );
      expect(result).toEqual({
        username: 'admin',
        email: 'admin@test.com',
        roles: ['admin', 'user'],
      });
    });

    it('should return undefined if the user is not found', async () => {
      const reqUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      } as any;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      const result = await controller.getProfile({ user: reqUser });

      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@test.com');
      expect(result).toBeUndefined();
    });

    it('should return profile by id when email is missing but id is present', async () => {
      const reqUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        roles: ['user'],
      } as any;

      const dbUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      } as any;

      (usersService.findOneById as jest.Mock).mockResolvedValue(dbUser);
      const result = await controller.getProfile({ user: reqUser });

      expect(usersService.findOneById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
      expect(result).toEqual({
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      });
    });

    it('should return an error if user object is empty', async () => {
      const reqUser = {} as any;

      const result = await controller.getProfile({ user: reqUser });

      expect(result).toEqual({ error: MESSAGES.errors.emailMissing });
      expect(usersService.findOneByEmail).not.toHaveBeenCalled();
    });

    it('should handle database errors when fetching profile', async () => {
      const reqUser = {
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      } as any;

      const errorMessage = 'Database connection error';
      (usersService.findOneByEmail as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getProfile({ user: reqUser })).rejects.toThrow(
        errorMessage,
      );
      expect(usersService.findOneByEmail).toHaveBeenCalledWith('test@test.com');
    });
  });
});
