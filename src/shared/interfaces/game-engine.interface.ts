import { ShipPosition } from '../models/ship.model';
import { Board } from '../models/board.model';

export interface IGameEngine {
  validateShipPlacement(board: Board, ships: ShipPosition[]): boolean;
  processAttack(
    board: Board,
    x: number,
    y: number,
  ): { hit: boolean; sunk: boolean; shipId?: string };
  checkWinCondition(board: Board): boolean;
  generateEmptyBoard(): Board;
  placeShipsOnBoard(board: Board, ships: ShipPosition[]): Board;
}

export interface IGameStateManager {
  createGame(player1Id: string, player2Id: string): Promise<string>;
  joinGame(gameId: string, playerId: string): Promise<boolean>;
  startGame(gameId: string): Promise<boolean>;
  endGame(gameId: string, winnerId?: string): Promise<boolean>;
  getGameState(gameId: string): Promise<any>;
  updateGameState(gameId: string, state: any): Promise<boolean>;
  getGamesByPlayer(playerId: string): Promise<any[]>;
  getActiveGames(): Promise<any[]>;
}
