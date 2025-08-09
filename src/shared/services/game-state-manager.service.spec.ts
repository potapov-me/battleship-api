import { Test, TestingModule } from '@nestjs/testing';
import { GameStateManagerService } from './game-state-manager.service';
import { RedisService } from '../redis.service';
import { GameEngineService } from './game-engine.service';
import { Game, GameStatus } from '../models/game.model';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import type { IGameEngine } from '../interfaces/game-engine.interface';

describe('GameStateManagerService', () => {
  let service: GameStateManagerService;
  let redisService: RedisService;
  let gameEngine: IGameEngine;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    keys: jest.fn(),
  };

  const mockGameEngine = {
    generateEmptyBoard: jest.fn(),
    validateShipPlacement: jest.fn(),
    processAttack: jest.fn(),
    checkWinCondition: jest.fn(),
    placeShipsOnBoard: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameStateManagerService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: 'IGameEngine',
          useValue: mockGameEngine,
        },
      ],
    }).compile();

    service = module.get<GameStateManagerService>(GameStateManagerService);
    redisService = module.get<RedisService>(RedisService);
    gameEngine = module.get<IGameEngine>('IGameEngine');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should create a new game successfully', async () => {
      const player1Id = 'player1';
      const player2Id = 'player2';
      const mockBoard = { grid: [], ships: [], playerId: '' };

      mockGameEngine.generateEmptyBoard.mockReturnValue(mockBoard);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.createGame(player1Id, player2Id);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^game_\d+_[a-z0-9]+$/);
      expect(mockGameEngine.generateEmptyBoard).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${result}`,
        expect.objectContaining({
          id: result,
          player1: { id: player1Id },
          player2: { id: player2Id },
          status: GameStatus.WAITING,
          currentTurn: player1Id,
        }),
        expect.any(Number)
      );
    });
  });

  describe('joinGame', () => {
    it('should allow player to join game', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: playerId } as any;

      mockRedisService.get.mockResolvedValue(mockGame);

      const result = await service.joinGame(gameId, playerId);

      expect(result).toBe(true);
      expect(mockRedisService.get).toHaveBeenCalledWith(`game:${gameId}`);
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';
      const playerId = 'player1';

      mockRedisService.get.mockResolvedValue(null);

      await expect(service.joinGame(gameId, playerId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException for non-waiting game', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;
      mockGame.player1 = { id: playerId } as any;

      mockRedisService.get.mockResolvedValue(mockGame);

      await expect(service.joinGame(gameId, playerId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for player not in game', async () => {
      const gameId = 'game_123';
      const playerId = 'player3';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: 'player1' } as any;
      mockGame.player2 = { id: 'player2' } as any;

      mockRedisService.get.mockResolvedValue(mockGame);

      await expect(service.joinGame(gameId, playerId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('startGame', () => {
    it('should start game successfully', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: 'player1' } as any;
      mockGame.player2 = { id: 'player2' } as any;

      mockRedisService.get.mockResolvedValue(mockGame);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.startGame(gameId);

      expect(result).toBe(true);
      expect(mockGame.status).toBe(GameStatus.ACTIVE);
      expect(mockGame.startedAt).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${gameId}`,
        mockGame,
        expect.any(Number)
      );
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);

      await expect(service.startGame(gameId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException for non-waiting game', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;

      mockRedisService.get.mockResolvedValue(mockGame);

      await expect(service.startGame(gameId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('endGame', () => {
    it('should end game successfully', async () => {
      const gameId = 'game_123';
      const winnerId = 'player1';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;

      mockRedisService.get.mockResolvedValue(mockGame);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.endGame(gameId, winnerId);

      expect(result).toBe(true);
      expect(mockGame.status).toBe(GameStatus.FINISHED);
      expect(mockGame.finishedAt).toBeDefined();
      expect(mockGame.winner).toEqual({ id: winnerId });
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${gameId}`,
        mockGame,
        expect.any(Number)
      );
    });

    it('should end game without winner', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;

      mockRedisService.get.mockResolvedValue(mockGame);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.endGame(gameId);

      expect(result).toBe(true);
      expect(mockGame.status).toBe(GameStatus.FINISHED);
      expect(mockGame.finishedAt).toBeDefined();
      expect(mockGame.winner).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);

      await expect(service.endGame(gameId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getGameState', () => {
    it('should return game state', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;

      mockRedisService.get.mockResolvedValue(mockGame);

      const result = await service.getGameState(gameId);

      expect(result).toEqual(mockGame);
      expect(mockRedisService.get).toHaveBeenCalledWith(`game:${gameId}`);
    });

    it('should return null for non-existent game', async () => {
      const gameId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getGameState(gameId);

      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    it('should update game state successfully', async () => {
      const gameId = 'game_123';
      const gameState = { id: gameId, status: GameStatus.ACTIVE };

      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.updateGameState(gameId, gameState);

      expect(result).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${gameId}`,
        gameState,
        expect.any(Number)
      );
    });

    it('should return false on error', async () => {
      const gameId = 'game_123';
      const gameState = { id: gameId, status: GameStatus.ACTIVE };

      mockRedisService.set.mockRejectedValue(new Error('Redis error'));

      const result = await service.updateGameState(gameId, gameState);

      expect(result).toBe(false);
    });
  });

  describe('getGamesByPlayer', () => {
    it('should return games for player', async () => {
      const playerId = 'player1';
      const mockGame1 = new Game();
      mockGame1.id = 'game1';
      mockGame1.player1 = { id: playerId } as any;
      const mockGame2 = new Game();
      mockGame2.id = 'game2';
      mockGame2.player2 = { id: playerId } as any;

      mockRedisService.keys.mockResolvedValue(['game:game1', 'game:game2', 'game:game3']);
      mockRedisService.get
        .mockResolvedValueOnce(mockGame1)
        .mockResolvedValueOnce(mockGame2)
        .mockResolvedValueOnce({ player1: { id: 'other' }, player2: { id: 'other2' } });

      const result = await service.getGamesByPlayer(playerId);

      expect(result).toHaveLength(2);
      expect(result).toContain(mockGame1);
      expect(result).toContain(mockGame2);
    });

    it('should return empty array when no games found', async () => {
      const playerId = 'player1';

      mockRedisService.keys.mockResolvedValue([]);

      const result = await service.getGamesByPlayer(playerId);

      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveGames', () => {
    it('should return active games', async () => {
      const mockGame1 = new Game();
      mockGame1.id = 'game1';
      mockGame1.status = GameStatus.ACTIVE;
      const mockGame2 = new Game();
      mockGame2.id = 'game2';
      mockGame2.status = GameStatus.ACTIVE;

      mockRedisService.keys.mockResolvedValue(['game:game1', 'game:game2', 'game:game3']);
      mockRedisService.get
        .mockResolvedValueOnce(mockGame1)
        .mockResolvedValueOnce(mockGame2)
        .mockResolvedValueOnce({ status: GameStatus.WAITING });

      const result = await service.getActiveGames();

      expect(result).toHaveLength(2);
      expect(result).toContain(mockGame1);
      expect(result).toContain(mockGame2);
    });

    it('should return empty array when no active games found', async () => {
      mockRedisService.keys.mockResolvedValue([]);

      const result = await service.getActiveGames();

      expect(result).toHaveLength(0);
    });
  });
});
