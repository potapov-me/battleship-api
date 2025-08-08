import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    generate_password_hash: jest.fn(),
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return an access token', () => {
      const user = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        roles: ['user'],
      };
      const loginDto = { email: 'test@test.com', password: 'password' };
      const req = { user };

      (authService.login as jest.Mock).mockReturnValue({
        access_token: 'test_token',
      });

      const loginSpy = jest.spyOn(authService, 'login');
      const result = controller.login(loginDto, req);
      expect(result).toEqual({ access_token: 'test_token' });
      expect(loginSpy).toHaveBeenCalledWith(user);
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
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

    it('should handle registration errors', async () => {
      const registerDto: RegisterDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const errorMessage = 'Пользователь с таким email уже существует';
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        error: errorMessage,
      });
    });
  });

  describe('getPasswordHash', () => {
    it('should return a password hash', async () => {
      const password = 'password';
      const hash = 'hashed_password';
      (usersService.generate_password_hash as jest.Mock).mockResolvedValue(
        hash,
      );

      const generatePasswordHashSpy = jest.spyOn(
        usersService,
        'generate_password_hash',
      );
      const result = await controller.getPasswordHash(password);
      expect(result).toBe(hash);
      expect(generatePasswordHashSpy).toHaveBeenCalledWith(password);
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const user = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        roles: [],
      };
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      const result = await controller.getProfile({ user });
      expect(result).toEqual(user);
    });

    it('should return an error if the user is not found', async () => {
      const user = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        roles: [],
      };
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      const result = await controller.getProfile({ user });
      expect(result).toEqual(undefined);
    });
  });
});
