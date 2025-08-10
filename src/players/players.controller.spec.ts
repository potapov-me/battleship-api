import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { User } from '../users/schemas/user.schema';
import {
  CreatePlayerDto,
  UpdatePlayerDto,
  PlayerResponseDto,
  PlayerStatsDto,
  PlayerListResponseDto,
} from './dto/player.dto';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: PlayersService;

  const createMockPlayerResponse = (overrides: Partial<PlayerResponseDto> = {}): PlayerResponseDto => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['player'],
    isEmailConfirmed: true,
    isActive: true,
    rating: 1000,
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockPlayerStats = (overrides: Partial<PlayerStatsDto> = {}): PlayerStatsDto => ({
    id: '1',
    username: 'testuser',
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    rating: 1000,
    averageOpponentRating: 1000,
    bestRating: 1000,
    gamesLast30Days: 0,
    ...overrides,
  });

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    save: jest.fn(),
  };

  const mockPlayersService = {
    createPlayer: jest.fn(),
    findAllPlayers: jest.fn(),
    findPlayerById: jest.fn(),
    findPlayerByUsername: jest.fn(),
    findPlayerByEmail: jest.fn(),
    updatePlayer: jest.fn(),
    deletePlayer: jest.fn(),
    getPlayerStats: jest.fn(),
    confirmEmail: jest.fn(),
    generateEmailConfirmationToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: mockPlayersService,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    controller = module.get<PlayersController>(PlayersController);
    service = module.get<PlayersService>(PlayersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPlayer', () => {
    it('should create a new player', async () => {
      const createPlayerDto: CreatePlayerDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        roles: ['player'],
      };

      const expectedResponse = createMockPlayerResponse({ isEmailConfirmed: false });

      mockPlayersService.createPlayer.mockResolvedValue(expectedResponse);

      const result = await controller.createPlayer(createPlayerDto);

      expect(service.createPlayer).toHaveBeenCalledWith(createPlayerDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findAllPlayers', () => {
    it('should return list of players with pagination', async () => {
      const expectedResponse: PlayerListResponseDto = {
        players: [
          createMockPlayerResponse({ id: '1', username: 'user1', email: 'user1@example.com' }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      mockPlayersService.findAllPlayers.mockResolvedValue(expectedResponse);

      const result = await controller.findAllPlayers(1, 10, 'test');

      expect(service.findAllPlayers).toHaveBeenCalledWith(1, 10, { search: 'test' });
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findPlayerById', () => {
    it('should return player by id', async () => {
      const playerId = '1';
      const expectedResponse = createMockPlayerResponse();

      mockPlayersService.findPlayerById.mockResolvedValue(expectedResponse);

      const result = await controller.findPlayerById(playerId);

      expect(service.findPlayerById).toHaveBeenCalledWith(playerId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findPlayerByUsername', () => {
    it('should return player by username', async () => {
      const username = 'testuser';
      const expectedResponse = createMockPlayerResponse();

      mockPlayersService.findPlayerByUsername.mockResolvedValue(
        expectedResponse,
      );

      const result = await controller.findPlayerByUsername(username);

      expect(service.findPlayerByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('findPlayerByEmail', () => {
    it('should return player by email', async () => {
      const email = 'test@example.com';
      const expectedResponse = createMockPlayerResponse();

      mockPlayersService.findPlayerByEmail.mockResolvedValue(expectedResponse);

      const result = await controller.findPlayerByEmail(email);

      expect(service.findPlayerByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updatePlayer', () => {
    it('should update player', async () => {
      const playerId = '1';
      const updatePlayerDto: UpdatePlayerDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const expectedResponse = createMockPlayerResponse({ username: 'updateduser', email: 'updated@example.com' });

      mockPlayersService.updatePlayer.mockResolvedValue(expectedResponse);

      const result = await controller.updatePlayer(playerId, updatePlayerDto);

      expect(service.updatePlayer).toHaveBeenCalledWith(
        playerId,
        updatePlayerDto,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deletePlayer', () => {
    it('should delete player', async () => {
      const playerId = '1';

      mockPlayersService.deletePlayer.mockResolvedValue(undefined);

      await controller.deletePlayer(playerId);

      expect(service.deletePlayer).toHaveBeenCalledWith(playerId);
    });
  });

  describe('getPlayerStats', () => {
    it('should return player stats', async () => {
      const playerId = '1';
      const expectedResponse = createMockPlayerStats({ totalGames: 10, wins: 7, losses: 3, winRate: 70, rating: 1200 });

      mockPlayersService.getPlayerStats.mockResolvedValue(expectedResponse);

      const result = await controller.getPlayerStats(playerId);

      expect(service.getPlayerStats).toHaveBeenCalledWith(playerId);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email', async () => {
      const token = 'test-token';
      const expectedResponse = { message: 'Email успешно подтвержден' };

      mockPlayersService.confirmEmail.mockResolvedValue(undefined);

      const result = await controller.confirmEmail(token);

      expect(service.confirmEmail).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('resendConfirmation', () => {
    it('should resend confirmation email', async () => {
      const email = 'test@example.com';
      const expectedResponse = { message: 'Токен подтверждения сгенерирован' };

      mockPlayersService.generateEmailConfirmationToken.mockResolvedValue(
        'new-token',
      );

      const result = await controller.resendConfirmation(email);

      expect(service.generateEmailConfirmationToken).toHaveBeenCalledWith(
        email,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getMyProfile', () => {
    it('should return current user profile', async () => {
      const mockRequest = {
        user: { id: '1' },
      };

      const expectedResponse = createMockPlayerResponse();

      mockPlayersService.findPlayerById.mockResolvedValue(expectedResponse);

      const result = await controller.getMyProfile(mockRequest);

      expect(service.findPlayerById).toHaveBeenCalledWith('1');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateMyProfile', () => {
    it('should update current user profile', async () => {
      const mockRequest = {
        user: { id: '1' },
      };

      const updatePlayerDto: UpdatePlayerDto = {
        username: 'updateduser',
      };

      const expectedResponse = createMockPlayerResponse({ username: 'updateduser' });

      mockPlayersService.updatePlayer.mockResolvedValue(expectedResponse);

      const result = await controller.updateMyProfile(
        mockRequest,
        updatePlayerDto,
      );

      expect(service.updatePlayer).toHaveBeenCalledWith('1', updatePlayerDto);
      expect(result).toEqual(expectedResponse);
    });
  });
});
