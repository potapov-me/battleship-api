import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            generate_password_hash: jest.fn(),
          },
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
    it('should return an access token', async () => {
      const user = { id: 1, username: 'test' };
      const loginDto = { email: 'test@test.com', password: 'password' };
      (authService.login as jest.Mock).mockReturnValue({
        access_token: 'test_token',
      });

      const result = await controller.login(loginDto, { user });
      expect(result).toEqual({ access_token: 'test_token' });
      expect(authService.login).toHaveBeenCalledWith(user);
    });
  });

  describe('getPasswordHash', () => {
    it('should return a password hash', async () => {
      const password = 'password';
      const hash = 'hashed_password';
      (usersService.generate_password_hash as jest.Mock).mockResolvedValue(
        hash,
      );

      const result = await controller.getPasswordHash(password, {});
      expect(result).toBe(hash);
      expect(usersService.generate_password_hash).toHaveBeenCalledWith(
        password,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', () => {
      const user = { id: 1, username: 'test' };
      const result = controller.getProfile({ user });
      expect(result).toBe(user);
    });
  });
});
