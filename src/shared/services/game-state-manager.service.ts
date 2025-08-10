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

    await this.redisService.set(`game:${gameId}`, game, this.GAME_TTL);

    this.logger.log(
      `Created game ${gameId} with players ${player1Id} and ${player2Id}`,
    );
    return gameId;
  }

  async joinGame(gameId: string, playerId: string): Promise<boolean> {
    const game = await this.getGameState(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game is not in waiting state');
    }

    if (game.player1.id !== playerId && game.player2.id !== playerId) {
      throw new BadRequestException('Player is not part of this game');
    }

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

    this.logger.log(`Ended game ${gameId} with winner ${winnerId || 'none'}`);
    return true;
  }

  async getGameState(gameId: string): Promise<any> {
    return await this.redisService.get<Game>(`game:${gameId}`);
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
      const gameKeys = await this.redisService.keys('game:*');
      const games: Game[] = [];

      for (const key of gameKeys) {
        const game = await this.redisService.get<Game>(key);
        if (
          game &&
          ((game.player1 && game.player1.id === playerId) ||
            (game.player2 && game.player2.id === playerId))
        ) {
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
      const gameKeys = await this.redisService.keys('game:*');
      const games: Game[] = [];

      for (const key of gameKeys) {
        const game = await this.redisService.get<Game>(key);
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

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
