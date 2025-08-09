import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Board } from 'src/shared/models/board.model';
import { Game, GameStatus } from 'src/shared/models/game.model';
import { ShipPosition } from '../shared/models/ship.model';
import type { IGameEngine } from '../shared/interfaces/game-engine.interface';
import type { IGameStateManager } from '../shared/interfaces/game-engine.interface';
import type { IAuditService } from '../shared/interfaces/notification.interface';
import type { INotificationService } from '../shared/interfaces/notification.interface';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @Inject('IGameEngine') private readonly gameEngine: IGameEngine,
    @Inject('IGameStateManager') private readonly gameStateManager: IGameStateManager,
    @Inject('IAuditService') private readonly auditService: IAuditService,
    @Inject('INotificationService') private readonly notificationService: INotificationService,
  ) {}

  async createGame(player1Id: string, player2Id: string): Promise<Game> {
    const gameId = await this.gameStateManager.createGame(player1Id, player2Id);
    const game = await this.gameStateManager.getGameState(gameId);
    
    await this.auditService.logGameAction(gameId, player1Id, 'game_created', { player2Id });
    
    this.logger.log(`Created new game: ${gameId}`);
    return game;
  }

  async placeShips(gameId: string, playerId: string, ships: ShipPosition[]): Promise<{ success: boolean }> {
    const game = await this.gameStateManager.getGameState(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Cannot place ships in active game');
    }

    // Определяем, какую доску обновлять
    const isPlayer1 = game.player1.id === playerId;
    const targetBoard = isPlayer1 ? game.board1 : game.board2;

    // Валидируем размещение кораблей
    if (!this.gameEngine.validateShipPlacement(targetBoard, ships)) {
      throw new BadRequestException('Invalid ship placement');
    }

    // Размещаем корабли
    const updatedBoard = this.gameEngine.placeShipsOnBoard(targetBoard, ships);
    
    if (isPlayer1) {
      game.board1 = updatedBoard;
    } else {
      game.board2 = updatedBoard;
    }

    // Проверяем, готовы ли оба игрока
    if (this.areShipsPlaced(game.board1) && this.areShipsPlaced(game.board2)) {
      await this.gameStateManager.startGame(gameId);
    }

    await this.gameStateManager.updateGameState(gameId, game);
    await this.auditService.logGameAction(gameId, playerId, 'ships_placed', { shipCount: ships.length });

    return { success: true };
  }

  async makeShot(gameId: string, playerId: string, x: number, y: number): Promise<{ hit: boolean; sunk: boolean; gameOver: boolean }> {
    const game = await this.gameStateManager.getGameState(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException('Game is not active');
    }

    if (game.currentTurn !== playerId) {
      throw new BadRequestException('Not your turn');
    }

    // Определяем, какую доску атаковать
    const isPlayer1 = game.player1.id === playerId;
    const targetBoard = isPlayer1 ? game.board2 : game.board1;

    // Обрабатываем атаку
    const attackResult = this.gameEngine.processAttack(targetBoard, x, y);
    
    // Обновляем доску
    if (isPlayer1) {
      game.board2 = targetBoard;
    } else {
      game.board1 = targetBoard;
    }

    // Проверяем условия победы
    const gameOver = this.gameEngine.checkWinCondition(targetBoard);
    
    if (gameOver) {
      await this.gameStateManager.endGame(gameId, playerId);
      await this.notificationService.sendGameUpdate(
        isPlayer1 ? game.player2.email : game.player1.email,
        gameId,
        `Игра окончена! Победитель: ${isPlayer1 ? game.player1.username : game.player2.username}`
      );
    } else {
      // Передаем ход другому игроку
      game.currentTurn = isPlayer1 ? game.player2.id : game.player1.id;
    }

    await this.gameStateManager.updateGameState(gameId, game);
    await this.auditService.logGameAction(gameId, playerId, 'shot_made', { 
      x, y, hit: attackResult.hit, sunk: attackResult.sunk 
    });

    return {
      hit: attackResult.hit,
      sunk: attackResult.sunk,
      gameOver
    };
  }

  async getGame(gameId: string): Promise<Game | null> {
    return await this.gameStateManager.getGameState(gameId);
  }

  async getGamesByPlayer(playerId: string): Promise<Game[]> {
    return await this.gameStateManager.getGamesByPlayer(playerId);
  }

  async getActiveGames(): Promise<Game[]> {
    return await this.gameStateManager.getActiveGames();
  }

  private areShipsPlaced(board: Board): boolean {
    return board.ships && board.ships.length > 0;
  }
}
