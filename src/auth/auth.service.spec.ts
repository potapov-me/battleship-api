import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if validation is successful', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
        username: 'testuser',
        createdAt: new Date(),
      };
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const compareSpy = jest.spyOn(bcrypt, 'compare');
      const result = await service.validateUser('test@test.com', 'password');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...expectedResult } = user;
      expect(result).toEqual(expectedResult);
      expect(compareSpy).toHaveBeenCalledWith('password', user.password);
    });

    it('should return null if user not found', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        password: 'hashedPassword',
        username: 'testuser',
        createdAt: new Date(),
      };
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', () => {
      const user = {
        email: 'test@test.com',
        id: 1,
        roles: ['user'],
      };
      const signSpy = jest.spyOn(service['jwtService'], 'sign');
      const result = service.login(user);
      expect(result).toEqual({
        access_token: 'test_token',
      });
      expect(signSpy).toHaveBeenCalledWith({ email: user.email, sub: user.id });
    });
  });
});
