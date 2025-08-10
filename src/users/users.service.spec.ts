import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockConfigService: jest.Mocked<ConfigService>;

  const createMockUserModel = (): any => {
    const mockFindOne = jest.fn();
    const mockSave = jest.fn();
    const mockExec = jest.fn();

    const mockModel = jest.fn().mockImplementation(() => ({
      save: mockSave,
    }));

    mockModel.findOne = mockFindOne;
    mockFindOne.mockReturnValue({
      exec: mockExec,
    });

    return mockModel;
  };

  beforeEach(async () => {
    mockUserModel = createMockUserModel();

    mockConfigService = {
      get: jest.fn().mockReturnValue('10'),
    } as jest.Mocked<ConfigService>;

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
      const mockUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        id: '507f1f77bcf86cd799439011',
      } as UserDocument;

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({
        exec: mockExec,
      });

      const result = await service.findOneByEmail('test@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({
        exec: mockExec,
      });

      const result = await service.findOneByEmail('nonexistent@example.com');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'nonexistent@example.com',
      });
      expect(result).toBeNull();
    });
  });

  describe('findOneByUsername', () => {
    it('should find user by username', async () => {
      const mockUser = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        id: '507f1f77bcf86cd799439011',
      } as UserDocument;

      const mockExec = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.findOne.mockReturnValue({
        exec: mockExec,
      });

      const result = await service.findOneByUsername('testuser');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'testuser',
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      mockUserModel.findOne.mockReturnValue({
        exec: mockExec,
      });

      const result = await service.findOneByUsername('nonexistentuser');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'nonexistentuser',
      });
      expect(result).toBeNull();
    });
  });

  describe('generate_password_hash', () => {
    it('should generate password hash', async () => {
      const password = 'testpassword';
      const result = await service.generate_password_hash(password);

      expect(mockConfigService.get).toHaveBeenCalledWith('SALT_ROUNDS', '10');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toBe(password); // Хеш не должен быть равен исходному паролю
    });

    it('should use default salt rounds when config is not set', async () => {
      mockConfigService.get.mockReturnValue(undefined);

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
      const mockUser = {
        username,
        email,
        password: 'hashedpassword',
        roles: ['user'],
        id: '507f1f77bcf86cd799439011',
      } as UserDocument;

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
        isEmailConfirmed: false,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should hash password before creating user', async () => {
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';

      const mockUser = {
        username,
        email,
        password: hashedPassword,
        roles: ['user'],
        id: '507f1f77bcf86cd799439011',
      } as UserDocument;

      const mockSave = jest.fn().mockResolvedValue(mockUser);
      mockUserModel.mockImplementation(() => ({
        save: mockSave,
      }));

      // Мокаем generate_password_hash
      jest
        .spyOn(service, 'generate_password_hash')
        .mockResolvedValue(hashedPassword);

      await service.createUser(username, email, password);

      expect(service.generate_password_hash).toHaveBeenCalledWith(password);
      expect(mockUserModel).toHaveBeenCalledWith({
        username,
        email,
        password: hashedPassword,
        roles: ['user'],
        isEmailConfirmed: false,
      });
    });
  });
});
