import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  IGameStateManager,
  type IGameEngine,
} from '../interfaces/game-engine.interface';
import { RedisService } from '../redis.service';
import { Game, GameStatus } from '../models/game.model';
import { GAME_CONSTANTS } from '../constants/game.constants';

@Injectable()
export class GameStateManagerService implements IGameStateManager {
  private readonly logger = new Logger(GameStateManagerService.name);
  private readonly GAME_TTL = GAME_CONSTANTS.GAME_TTL;
  private readonly PLAYER_GAMES_TTL = 86400; // 24 hours
  private readonly ACTIVE_GAMES_TTL = 3600; // 1 hour

  constructor(
    private readonly redisService: RedisService,
    @Inject('IGameEngine') private readonly gameEngine: IGameEngine,
  ) {}

  async createGame(player1Id: string, player2Id: string): Promise<string> {
    const gameId = this.generateGameId();
    const game = new Game();

    game.id = gameId;
    game.player1 = { id: player1Id } as any;
    game.player2 = { id: player2Id } as any;
    game.board1 = this.gameEngine.generateEmptyBoard();
    game.board2 = this.gameEngine.generateEmptyBoard();
    game.board1.playerId = player1Id;
    game.board2.playerId = player2Id;
    game.currentTurn = player1Id;
    game.status = GameStatus.WAITING;
    game.createdAt = new Date();

    // Сохраняем игру
    await this.redisService.set(`game:${gameId}`, game, this.GAME_TTL);

    // Создаем индексы для быстрого поиска
    await this.createGameIndexes(gameId, player1Id, player2Id);

    this.logger.log(
      `Created game ${gameId} with players ${player1Id} and ${player2Id}`,
    );
    return gameId;
  }

  private async createGameIndexes(
    gameId: string,
    player1Id: string,
    player2Id: string,
  ): Promise<void> {
    try {
      // Индекс игрока -> игры
      await this.redisService.sadd(`player:${player1Id}:games`, gameId);
      await this.redisService.sadd(`player:${player2Id}:games`, gameId);
      await this.redisService.expire(
        `player:${player1Id}:games`,
        this.PLAYER_GAMES_TTL,
      );
      await this.redisService.expire(
        `player:${player2Id}:games`,
        this.PLAYER_GAMES_TTL,
      );

      // Индекс статуса -> игры
      await this.redisService.sadd(
        `status:${GameStatus.WAITING}:games`,
        gameId,
      );
      await this.redisService.expire(
        `status:${GameStatus.WAITING}:games`,
        this.ACTIVE_GAMES_TTL,
      );

      // Индекс активных игр
      await this.redisService.sadd('active:games', gameId);
      await this.redisService.expire('active:games', this.ACTIVE_GAMES_TTL);
    } catch (error) {
      this.logger.error(`Failed to create indexes for game ${gameId}:`, error);
    }
  }

  async joinGame(playerId: string, gameId: string): Promise<boolean> {
    const game = await this.redisService.get<Game>(`game:${gameId}`);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game is not waiting for players');
    }

    // If player is already in the game, nothing to do
    const isPlayerAlreadyInGame =
      (game.player1?.id && game.player1.id === playerId) ||
      (game.player2?.id && game.player2.id === playerId);
    if (isPlayerAlreadyInGame) {
      return true;
    }

    // If both slots are occupied and player is not one of them
    const bothPlayersSet =
      Boolean(game.player1?.id) && Boolean(game.player2?.id);
    if (bothPlayersSet) {
      throw new BadRequestException('Player not in game');
    }

    // Fill the first available slot
    if (!game.player1?.id) {
      game.player1 = { id: playerId } as any;
    } else if (!game.player2?.id) {
      game.player2 = { id: playerId } as any;
    }

    await this.redisService.set(`game:${gameId}`, game);
    return true;
  }

  async startGame(gameId: string): Promise<boolean> {
    const game = await this.getGameState(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game cannot be started');
    }

    game.status = GameStatus.ACTIVE;
    game.startedAt = new Date();

    await this.updateGameState(gameId, game);

    // Обновляем индексы
    await this.updateGameStatusIndexes(
      gameId,
      GameStatus.WAITING,
      GameStatus.ACTIVE,
    );

    this.logger.log(`Started game ${gameId}`);
    return true;
  }

  async endGame(gameId: string, winnerId?: string): Promise<boolean> {
    const game = await this.getGameState(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    game.status = GameStatus.FINISHED;
    game.finishedAt = new Date();
    if (winnerId) {
      game.winner = { id: winnerId } as any;
    }

    await this.updateGameState(gameId, game);

    // Обновляем индексы
    await this.updateGameStatusIndexes(
      gameId,
      GameStatus.ACTIVE,
      GameStatus.FINISHED,
    );

    this.logger.log(`Ended game ${gameId} with winner ${winnerId || 'none'}`);
    return true;
  }

  private async updateGameStatusIndexes(
    gameId: string,
    oldStatus: GameStatus,
    newStatus: GameStatus,
  ): Promise<void> {
    try {
      // Удаляем из старого статуса
      await this.redisService.srem(`status:${oldStatus}:games`, gameId);

      // Добавляем в новый статус
      await this.redisService.sadd(`status:${newStatus}:games`, gameId);
      await this.redisService.expire(
        `status:${newStatus}:games`,
        this.ACTIVE_GAMES_TTL,
      );

      // Обновляем индекс активных игр
      if (newStatus === GameStatus.ACTIVE) {
        await this.redisService.sadd('active:games', gameId);
      } else {
        await this.redisService.srem('active:games', gameId);
      }
      await this.redisService.expire('active:games', this.ACTIVE_GAMES_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to update status indexes for game ${gameId}:`,
        error,
      );
    }
  }

  async getGameState(gameId: string): Promise<Game | null> {
    return this.redisService.get<Game>(`game:${gameId}`);
  }

  async updateGameState(gameId: string, state: any): Promise<boolean> {
    try {
      await this.redisService.set(`game:${gameId}`, state, this.GAME_TTL);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update game state for ${gameId}:`, error);
      return false;
    }
  }

  async getGamesByPlayer(playerId: string): Promise<Game[]> {
    try {
      // Используем индекс для быстрого поиска
      const gameIds = await this.redisService.smembers(
        `player:${playerId}:games`,
      );
      if (!gameIds || gameIds.length === 0) {
        return [];
      }

      const games: Game[] = [];
      for (const gameId of gameIds) {
        const game = await this.getGameState(gameId);
        if (game) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      this.logger.error(`Failed to get games for player ${playerId}:`, error);
      return [];
    }
  }

  async getActiveGames(): Promise<Game[]> {
    try {
      // Используем индекс активных игр
      const gameIds = await this.redisService.smembers('active:games');
      if (!gameIds || gameIds.length === 0) {
        return [];
      }

      const games: Game[] = [];
      for (const gameId of gameIds) {
        const game = await this.getGameState(gameId);
        if (game && game.status === GameStatus.ACTIVE) {
          games.push(game);
        }
      }

      return games;
    } catch (error) {
      this.logger.error('Failed to get active games:', error);
      return [];
    }
  }

  async cleanupFinishedGames(): Promise<void> {
    try {
      const finishedGameIds = await this.redisService.smembers(
        `status:${GameStatus.FINISHED}:games`,
      );

      for (const gameId of finishedGameIds) {
        const game = await this.getGameState(gameId);
        if (game && game.finishedAt) {
          const daysSinceFinished =
            (Date.now() - game.finishedAt.getTime()) / (1000 * 60 * 60 * 24);

          // Удаляем игры старше 7 дней
          if (daysSinceFinished > 7) {
            await this.deleteGame(gameId);
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup finished games:', error);
    }
  }

  private async deleteGame(gameId: string): Promise<void> {
    try {
      const game = await this.getGameState(gameId);
      if (!game) return;

      // Удаляем игру
      await this.redisService.del(`game:${gameId}`);

      // Удаляем из индексов
      if (game.player1?.id) {
        await this.redisService.srem(`player:${game.player1.id}:games`, gameId);
      }
      if (game.player2?.id) {
        await this.redisService.srem(`player:${game.player2.id}:games`, gameId);
      }

      await this.redisService.srem(`status:${game.status}:games`, gameId);
      await this.redisService.srem('active:games', gameId);

      this.logger.log(`Cleaned up finished game: ${gameId}`);
    } catch (error) {
      this.logger.error(`Failed to delete game ${gameId}:`, error);
    }
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
