import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Board, Cell } from 'src/shared/models/board.model';
import { Game, GameStatus } from 'src/shared/models/game.model';
import { ShipPosition } from '../shared/models/ship.model';
import { RedisService } from '../shared/redis.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(private readonly redisService: RedisService) {}

  async createGame(): Promise<Game> {
    const game = new Game();
    game.id = this.generateGameId();
    game.status = GameStatus.WAITING;
    game.board1 = this.generateEmptyBoard();
    game.board2 = this.generateEmptyBoard();
    
    // Сохранить в Redis
    await this.redisService.set(`game:${game.id}`, game, 3600); // TTL 1 hour
    
    this.logger.log(`Created new game: ${game.id}`);
    return game;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEmptyBoard(): Board {
    const board = new Board();
    board.grid = [];
    for (let i = 0; i < 10; i++) {
      board.grid[i] = [];
      for (let j = 0; j < 10; j++) {
        const cell = new Cell();
        cell.x = i;
        cell.y = j;
        cell.isHit = false;
        board.grid[i][j] = cell;
      }
    }
    return board;
  }

  validateShipPlacement(board: Board, ships: ShipPosition[]): boolean {
    // TODO: Implement comprehensive ship placement validation
    // - Корабли не выходят за границы
    // - Не пересекаются
    // - Правильное количество каждого типа
    // - Соприкасаются только углами (не боками)
    
    if (!ships || ships.length === 0) {
      return false;
    }

    // Basic validation - check if ships are within board boundaries
    for (const ship of ships) {
      if (ship.x < 0 || ship.x >= 10 || ship.y < 0 || ship.y >= 10) {
        return false;
      }
    }

    return true;
  }

  async processAttack(gameId: string, x: number, y: number, playerId: string): Promise<{ hit: boolean; sunk: boolean; gameOver: boolean }> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.ACTIVE) {
      throw new BadRequestException('Game is not active');
    }

    if (game.currentTurn !== playerId) {
      throw new BadRequestException('Not your turn');
    }

    // Determine which board to attack
    const targetBoard = game.player1.id === playerId ? game.board2 : game.board1;
    
    if (x < 0 || x >= 10 || y < 0 || y >= 10) {
      throw new BadRequestException('Invalid coordinates');
    }

    const cell = targetBoard.grid[x][y];
    if (cell.isHit) {
      throw new BadRequestException('Cell already hit');
    }

    // Mark cell as hit
    cell.isHit = true;
    
    // Check if ship was hit (simplified logic)
    const hit = Math.random() > 0.7; // 30% chance of hit for demo
    const sunk = hit && Math.random() > 0.8; // 20% chance of sunk if hit
    
    // Switch turns
    game.currentTurn = game.currentTurn === game.player1.id ? game.player2.id : game.player1.id;
    
    // Check win condition
    const gameOver = this.checkGameWinCondition(game);
    if (gameOver) {
      game.status = GameStatus.FINISHED;
    }
    
    // Save updated game state
    await this.redisService.set(`game:${gameId}`, game, 3600);
    
    return { hit, sunk, gameOver };
  }

  async placeShips(gameId: string, userId: string, ships: ShipPosition[]): Promise<{ success: boolean }> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (!this.validateShipPlacement(game.board1, ships)) {
      throw new BadRequestException('Invalid ship placement');
    }

    // Determine which board to update
    const targetBoard = game.player1.id === userId ? game.board1 : game.board2;
    
    // Place ships on the board
    for (const ship of ships) {
      if (ship.x >= 0 && ship.x < 10 && ship.y >= 0 && ship.y < 10) {
        targetBoard.grid[ship.x][ship.y].shipId = `ship_${ship.x}_${ship.y}_${Date.now()}`;
      }
    }

    // Check if both players have placed ships
    if (this.areShipsPlaced(game.board1) && this.areShipsPlaced(game.board2)) {
      game.status = GameStatus.ACTIVE;
      game.currentTurn = game.player1.id; // Player 1 goes first
    }

    // Save updated game state
    await this.redisService.set(`game:${gameId}`, game, 3600);
    
    return { success: true };
  }

  private areShipsPlaced(board: Board): boolean {
    // Simplified check - in real implementation, check for proper ship placement
    return board.grid.some(row => row.some(cell => cell.shipId));
  }

  async makeShot(gameId: string, userId: string, x: number, y: number): Promise<{ hit: boolean; sunk: boolean }> {
    const result = await this.processAttack(gameId, x, y, userId);
    return { hit: result.hit, sunk: result.sunk };
  }

  private checkGameWinCondition(game: Game): boolean {
    // Simplified win condition - check if all cells with ships are hit
    const board1Destroyed = this.isBoardDestroyed(game.board1);
    const board2Destroyed = this.isBoardDestroyed(game.board2);
    
    return board1Destroyed || board2Destroyed;
  }

  private isBoardDestroyed(board: Board): boolean {
    // Check if all ships are destroyed
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const cell = board.grid[i][j];
        if (cell.shipId && !cell.isHit) {
          return false;
        }
      }
    }
    return true;
  }

  async getGame(gameId: string): Promise<Game | null> {
    return await this.redisService.get<Game>(`game:${gameId}`);
  }

  async checkWinCondition(gameId: string): Promise<{ gameOver: boolean; winner: string | null }> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const gameOver = this.checkGameWinCondition(game);
    let winner: string | null = null;
    
    if (gameOver) {
      // Проверяем, что игроки существуют перед обращением к их id
      if (this.isBoardDestroyed(game.board1) && game.player2?.id) {
        winner = game.player2.id;
      } else if (this.isBoardDestroyed(game.board2) && game.player1?.id) {
        winner = game.player1.id;
      }
    }

    return { gameOver, winner };
  }
}
