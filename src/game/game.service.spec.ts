import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { Game, GameStatus } from '../shared/models/game.model';
import { Board } from '../shared/models/board.model';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ShipType, ShipDirection } from '../shared/models/ship.model';
import type { IGameEngine } from '../shared/interfaces/game-engine.interface';
import type { IGameStateManager } from '../shared/interfaces/game-engine.interface';
import type { IAuditService } from '../shared/interfaces/notification.interface';
import type { INotificationService } from '../shared/interfaces/notification.interface';
import { UsersService } from '../users/users.service';

describe('GameService', () => {
  let service: GameService;
  let gameEngine: IGameEngine;
  let gameStateManager: IGameStateManager;
  let auditService: IAuditService;
  let notificationService: INotificationService;

  const mockGameEngine = {
    validateShipPlacement: jest.fn(),
    processAttack: jest.fn(),
    checkWinCondition: jest.fn(),
    generateEmptyBoard: jest.fn(),
    placeShipsOnBoard: jest.fn(),
  };

  const mockGameStateManager = {
    createGame: jest.fn(),
    joinGame: jest.fn(),
    startGame: jest.fn(),
    endGame: jest.fn(),
    getGameState: jest.fn(),
    updateGameState: jest.fn(),
    getGamesByPlayer: jest.fn(),
    getActiveGames: jest.fn(),
  };

  const mockAuditService = {
    logUserAction: jest.fn(),
    logGameAction: jest.fn(),
    getAuditLog: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
    sendEmailConfirmation: jest.fn(),
    sendGameInvitation: jest.fn(),
    sendGameUpdate: jest.fn(),
  };

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    findOneById: jest.fn(),
    findManyByIds: jest.fn(),
    findManyByWins: jest.fn(),
    generate_password_hash: jest.fn(),
    createUser: jest.fn(),
    findOneByUsername: jest.fn(),
    setEmailConfirmationToken: jest.fn(),
    confirmEmailByToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: 'IGameEngine',
          useValue: mockGameEngine,
        },
        {
          provide: 'IGameStateManager',
          useValue: mockGameStateManager,
        },
        {
          provide: 'IAuditService',
          useValue: mockAuditService,
        },
        {
          provide: 'INotificationService',
          useValue: mockNotificationService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    gameEngine = module.get<IGameEngine>('IGameEngine');
    gameStateManager = module.get<IGameStateManager>('IGameStateManager');
    auditService = module.get<IAuditService>('IAuditService');
    notificationService = module.get<INotificationService>(
      'INotificationService',
    );
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
      const gameId = 'game_123';

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: player1Id } as any;
      mockGame.player2 = { id: player2Id } as any;

      mockGameStateManager.createGame.mockResolvedValue(gameId);
      mockGameStateManager.getGameState.mockResolvedValue(mockGame);
      mockAuditService.logGameAction.mockResolvedValue(undefined);

      const result = await service.createGame(player1Id, player2Id);

      expect(result).toBeDefined();
      expect(result.id).toBe(gameId);
      expect(result.status).toBe(GameStatus.WAITING);
      expect(mockGameStateManager.createGame).toHaveBeenCalledWith(
        player1Id,
        player2Id,
      );
      expect(mockGameStateManager.getGameState).toHaveBeenCalledWith(gameId);
      expect(mockAuditService.logGameAction).toHaveBeenCalledWith(
        gameId,
        player1Id,
        'game_created',
        { player2Id },
      );
    });
  });

  describe('placeShips', () => {
    it('should place ships successfully', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const ships = [
        {
          x: 0,
          y: 0,
          type: ShipType.CARRIER,
          direction: ShipDirection.HORIZONTAL,
        },
      ];

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: playerId } as any;
      mockGame.board1 = new Board();
      mockGame.board2 = new Board();

      mockGameStateManager.getGameState.mockResolvedValue(mockGame);
      mockGameEngine.validateShipPlacement.mockReturnValue(true);
      mockGameEngine.placeShipsOnBoard.mockReturnValue(mockGame.board1);
      mockGameStateManager.updateGameState.mockResolvedValue(true);
      mockAuditService.logGameAction.mockResolvedValue(undefined);

      const result = await service.placeShips(gameId, playerId, ships);

      expect(result.success).toBe(true);
      expect(mockGameEngine.validateShipPlacement).toHaveBeenCalledWith(
        mockGame.board1,
        ships,
      );
      expect(mockGameEngine.placeShipsOnBoard).toHaveBeenCalledWith(
        mockGame.board1,
        ships,
      );
      expect(mockGameStateManager.updateGameState).toHaveBeenCalledWith(
        gameId,
        mockGame,
      );
      expect(mockAuditService.logGameAction).toHaveBeenCalledWith(
        gameId,
        playerId,
        'ships_placed',
        { shipCount: 1 },
      );
    });

    it('should throw NotFoundException for non-existent game', async () => {
      const gameId = 'non-existent';
      const playerId = 'player1';
      const ships = [
        {
          x: 0,
          y: 0,
          type: ShipType.CARRIER,
          direction: ShipDirection.HORIZONTAL,
        },
      ];

      mockGameStateManager.getGameState.mockResolvedValue(null);

      await expect(service.placeShips(gameId, playerId, ships)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for invalid ship placement', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const ships = [
        {
          x: -1,
          y: 0,
          type: ShipType.CARRIER,
          direction: ShipDirection.HORIZONTAL,
        },
      ];

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.WAITING;
      mockGame.player1 = { id: playerId } as any;
      mockGame.board1 = new Board();
      mockGame.board2 = new Board();

      mockGameStateManager.getGameState.mockResolvedValue(mockGame);
      mockGameEngine.validateShipPlacement.mockReturnValue(false);

      await expect(service.placeShips(gameId, playerId, ships)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('makeShot', () => {
    it('should make a shot successfully', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const x = 5;
      const y = 5;

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;
      mockGame.currentTurn = playerId;
      mockGame.player1 = { id: playerId } as any;
      mockGame.player2 = { id: 'player2' } as any;
      mockGame.board1 = new Board();
      mockGame.board2 = new Board();

      const attackResult = { hit: true, sunk: false };

      mockGameStateManager.getGameState.mockResolvedValue(mockGame);
      mockGameEngine.processAttack.mockReturnValue(attackResult);
      mockGameEngine.checkWinCondition.mockReturnValue(false);
      mockGameStateManager.updateGameState.mockResolvedValue(true);
      mockAuditService.logGameAction.mockResolvedValue(undefined);

      const result = await service.makeShot(gameId, playerId, x, y);

      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('sunk');
      expect(result).toHaveProperty('gameOver');
      expect(result.hit).toBe(true);
      expect(result.sunk).toBe(false);
      expect(result.gameOver).toBe(false);
      expect(mockGameEngine.processAttack).toHaveBeenCalledWith(
        mockGame.board2,
        x,
        y,
      );
      expect(mockGameStateManager.updateGameState).toHaveBeenCalledWith(
        gameId,
        mockGame,
      );
    });

    it('should handle game over when shot results in win', async () => {
      const gameId = 'game_123';
      const playerId = 'player1';
      const x = 5;
      const y = 5;

      const mockGame = new Game();
      mockGame.id = gameId;
      mockGame.status = GameStatus.ACTIVE;
      mockGame.currentTurn = playerId;
      mockGame.player1 = {
        id: playerId,
        email: 'player1@test.com',
        username: 'player1',
      } as any;
      mockGame.player2 = {
        id: 'player2',
        email: 'player2@test.com',
        username: 'player2',
      } as any;
      mockGame.board1 = new Board();
      mockGame.board2 = new Board();

      const attackResult = { hit: true, sunk: true };

      mockGameStateManager.getGameState.mockResolvedValue(mockGame);
      mockGameEngine.processAttack.mockReturnValue(attackResult);
      mockGameEngine.checkWinCondition.mockReturnValue(true);
      mockGameStateManager.endGame.mockResolvedValue(true);
      mockGameStateManager.updateGameState.mockResolvedValue(true);
      mockNotificationService.sendGameUpdate.mockResolvedValue(undefined);
      mockAuditService.logGameAction.mockResolvedValue(undefined);

      const result = await service.makeShot(gameId, playerId, x, y);

      expect(result.gameOver).toBe(true);
      expect(mockGameStateManager.endGame).toHaveBeenCalledWith(
        gameId,
        playerId,
      );
      expect(mockNotificationService.sendGameUpdate).toHaveBeenCalledWith(
        'player2@test.com',
        gameId,
        'Игра окончена! Победитель: player1',
      );
    });
  });

  describe('getGame', () => {
    it('should return game from game state manager', async () => {
      const gameId = 'game_123';
      const mockGame = new Game();
      mockGame.id = gameId;

      mockGameStateManager.getGameState.mockResolvedValue(mockGame);

      const result = await service.getGame(gameId);

      expect(result).toEqual(mockGame);
      expect(mockGameStateManager.getGameState).toHaveBeenCalledWith(gameId);
    });

    it('should return null for non-existent game', async () => {
      const gameId = 'non-existent';

      mockGameStateManager.getGameState.mockResolvedValue(null);

      const result = await service.getGame(gameId);

      expect(result).toBeNull();
      expect(mockGameStateManager.getGameState).toHaveBeenCalledWith(gameId);
    });
  });

  describe('getGamesByPlayer', () => {
    it('should return games for player', async () => {
      const playerId = 'player1';
      const mockGames = [new Game(), new Game()];

      mockGameStateManager.getGamesByPlayer.mockResolvedValue(mockGames);

      const result = await service.getGamesByPlayer(playerId);

      expect(result).toEqual(mockGames);
      expect(mockGameStateManager.getGamesByPlayer).toHaveBeenCalledWith(
        playerId,
      );
    });
  });

  describe('getActiveGames', () => {
    it('should return active games', async () => {
      const mockGames = [new Game(), new Game()];

      mockGameStateManager.getActiveGames.mockResolvedValue(mockGames);

      const result = await service.getActiveGames();

      expect(result).toEqual(mockGames);
      expect(mockGameStateManager.getActiveGames).toHaveBeenCalled();
    });
  });
});
