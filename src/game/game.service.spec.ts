import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { RedisService } from '../shared/redis.service';
import { Game, GameStatus } from '../shared/models/game.model';
import { Board } from '../shared/models/board.model';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('GameService', () => {
  let service: GameService;
  let redisService: RedisService;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hgetall: jest.fn(),
    hdel: jest.fn(),
    expire: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should create a new game successfully', async () => {
      const mockGame = new Game();
      mockGame.id = 'game_123';
      mockGame.status = GameStatus.WAITING;

      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.createGame();

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.status).toBe(GameStatus.WAITING);
      expect(result.board1).toBeDefined();
      expect(result.board2).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${result.id}`,
        result,
        3600,
      );
    });
  });

  describe('generateEmptyBoard', () => {
    it('should generate a 10x10 board', () => {
      const board = service.generateEmptyBoard();

      expect(board).toBeDefined();
      expect(board.grid).toHaveLength(10);
      expect(board.grid[0]).toHaveLength(10);
      expect(board.grid[9]).toHaveLength(10);
    });

    it('should have all cells with correct properties', () => {
      const board = service.generateEmptyBoard();

      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const cell = board.grid[i][j];
          expect(cell.x).toBe(i);
          expect(cell.y).toBe(j);
          expect(cell.isHit).toBe(false);
        }
      }
    });
  });

  describe('validateShipPlacement', () => {
    it('should return false for empty ships array', () => {
      const board = service.generateEmptyBoard();
      const ships = [];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return false for ships outside boundaries', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: -1, y: 0 },
        { x: 10, y: 5 },
        { x: 5, y: -1 },
        { x: 5, y: 10 },
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return true for valid ship placement', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 9, y: 9 },
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(true);
    });
  });

  describe('getGame', () => {
    it('should return game from Redis', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;

      mockRedisService.get.mockResolvedValue(mockGame);

      const result = await service.getGame(gameId);

      expect(result).toEqual(mockGame);
      expect(mockRedisService.get).toHaveBeenCalledWith(`game:${gameId}`);
    });

    it('should return null for non-existent game', async () => {
      const gameId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);

      const result = await service.getGame(gameId);

      expect(result).toBeNull();
      expect(mockRedisService.get).toHaveBeenCalledWith(`game:${gameId}`);
    });
  });

  describe('placeShips', () => {
    it('should place ships successfully', async () => {
      const gameId = 'game_123';
      const userId = 'user_123';
      const ships = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.player1 = { id: userId } as any;
      mockGame.board1 = service.generateEmptyBoard();
      mockGame.board2 = service.generateEmptyBoard();

      mockRedisService.get.mockResolvedValue(mockGame);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.placeShips(gameId, userId, ships);

      expect(result.success).toBe(true);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        `game:${gameId}`,
        mockGame,
        3600,
      );
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';
      const userId = 'user_123';
      const ships = [{ x: 0, y: 0 }];

      mockRedisService.get.mockResolvedValue(null);

      await expect(service.placeShips(gameId, userId, ships)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid ship placement', async () => {
      const gameId = 'game_123';
      const userId = 'user_123';
      const ships = [{ x: -1, y: 0 }]; // Invalid placement

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.player1 = { id: userId } as any;
      mockGame.board1 = service.generateEmptyBoard();
      mockGame.board2 = service.generateEmptyBoard();

      mockRedisService.get.mockResolvedValue(mockGame);

      await expect(service.placeShips(gameId, userId, ships)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('makeShot', () => {
    it('should make a shot successfully', async () => {
      const gameId = 'game_123';
      const userId = 'user_123';
      const x = 5;
      const y = 5;

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;
      mockGame.currentTurn = userId;
      mockGame.player1 = { id: userId } as any;
      mockGame.player2 = { id: 'user_456' } as any;
      mockGame.board1 = service.generateEmptyBoard();
      mockGame.board2 = service.generateEmptyBoard();

      mockRedisService.get.mockResolvedValue(mockGame);
      mockRedisService.set.mockResolvedValue(undefined);

      const result = await service.makeShot(gameId, userId, x, y);

      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('sunk');
      expect(typeof result.hit).toBe('boolean');
      expect(typeof result.sunk).toBe('boolean');
    });
  });

  describe('checkWinCondition', () => {
    it('should check win condition for existing game', async () => {
      const gameId = 'game_123';

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.board1 = service.generateEmptyBoard();
      mockGame.board2 = service.generateEmptyBoard();

      mockRedisService.get.mockResolvedValue(mockGame);

      const result = await service.checkWinCondition(gameId);

      expect(result).toHaveProperty('gameOver');
      expect(result).toHaveProperty('winner');
      expect(typeof result.gameOver).toBe('boolean');
      expect(result.winner).toBeNull(); // No winner in empty game
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';

      mockRedisService.get.mockResolvedValue(null);

      await expect(service.checkWinCondition(gameId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
