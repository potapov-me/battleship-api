import { Injectable } from '@nestjs/common';
import { Board, Cell } from 'src/shared/models/board.model';
import { Game, GameStatus } from 'src/shared/models/game.model';
import { ShipPosition } from '../shared/models/ship.model';

@Injectable()
export class GameService {
  createGame() {
    const game = new Game();
    game.status = GameStatus.WAITING;
    game.board1 = this.generateEmptyBoard();
    // Сохранить в Redis/БД
    return game;
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

  validateShipPlacement(/*board: Board*/) {
    // Проверка:
    // - Корабли не выходят за границы
    // - Не пересекаются
    // - Правильное количество каждого типа
    // - Соприкасаются только углами (не боками)
  }

  processAttack(/*gameId: string, x: number, y: number*/) {
    // 1. Проверить, чей сейчас ход
    // 2. Обновить ячейку (isHit = true)
    // 3. Проверить, потоплен ли корабль
    // 4. Передать ход противнику
    // 5. Проверить условие победы
  }

  placeShips(gameId: string, userId: string, ships: ShipPosition[]) {
    // TODO: Implement ship placement logic
    // 1. Find the game by gameId
    // 2. Find the correct board for the userId
    // 3. Validate ship placement (using validateShipPlacement)
    // 4. Place ships on the board
    // 5. Update game state
    console.log(`User ${userId} in game ${gameId} is placing ships:`, ships);
    return { success: true };
  }

  makeShot(gameId: string, userId: string, x: number, y: number) {
    // TODO: Implement shot logic (similar to processAttack)
    // 1. Find the game by gameId
    // 2. Check if it's the user's turn
    // 3. Get the opponent's board
    // 4. Update the cell at (x, y) to isHit = true
    // 5. Check if a ship is hit or sunk
    // 6. Check for win condition
    // 7. Switch turns
    console.log(
      `User ${userId} in game ${gameId} made a shot at (${x}, ${y}).`,
    );
    return { hit: false, sunk: null }; // Example response
  }

  checkWinCondition(gameId: string) {
    // TODO: Implement win condition logic
    // 1. Find the game by gameId
    // 2. Check if all ships on one of the boards are sunk
    // 3. If so, update game status to FINISHED
    console.log(`Checking win condition for game ${gameId}.`);
    return { gameOver: false, winner: null }; // Example response
  }
}
