import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUserModel = jest.fn().mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({}),
    }));
    mockUserModel.findOne = jest.fn();

    mockConfigService = {
      get: jest.fn().mockReturnValue('10'),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = { email: 'test@example.com', username: 'testuser' };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOneByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = { email: 'test@example.com', username: 'testuser' };
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOneByUsername('testuser');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'testuser',
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('generate_password_hash', () => {
    it('should generate password hash', async () => {
      const password = 'testpassword';
      const result = await service.generate_password_hash(password);

      expect(mockConfigService.get).toHaveBeenCalledWith('SALT_ROUNDS', '10');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'testpassword';
      const mockUser = { username, email, password: 'hashedpassword' };

      const mockSave = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await service.createUser(username, email, password);

      expect(mockUserModel).toHaveBeenCalledWith({
        username,
        email,
        password: expect.any(String),
        roles: ['user'],
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });
});
