import { Injectable, Logger } from '@nestjs/common';
import { IGameEngine } from '../interfaces/game-engine.interface';
import { Board, Cell } from '../models/board.model';
import {
  Ship,
  ShipType,
  ShipPosition,
  ShipDirection,
} from '../models/ship.model';
import { GAME_CONSTANTS } from '../constants/game.constants';
import { AttackResult } from '../types/game.types';

@Injectable()
export class GameEngineService implements IGameEngine {
  private readonly logger = new Logger(GameEngineService.name);

  private readonly SHIP_SIZES = GAME_CONSTANTS.SHIP_SIZES;
  private readonly REQUIRED_SHIPS = GAME_CONSTANTS.REQUIRED_SHIPS;

  generateEmptyBoard(): Board {
    const board = new Board();
    board.grid = [];
    board.ships = [];
    board.playerId = '';

    for (let i = 0; i < GAME_CONSTANTS.BOARD_SIZE; i++) {
      board.grid[i] = [];
      for (let j = 0; j < GAME_CONSTANTS.BOARD_SIZE; j++) {
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
    if (!ships || ships.length === 0) {
      this.logger.warn('No ships provided for validation');
      return false;
    }

    // Проверяем количество кораблей каждого типа
    const shipCounts = new Map<ShipType, number>();
    for (const ship of ships) {
      const shipType = ship.type;
      shipCounts.set(shipType, (shipCounts.get(shipType) || 0) + 1);
    }

    for (const [shipType, required] of Object.entries(this.REQUIRED_SHIPS)) {
      const actualCount =
        shipCounts.get(shipType.toLowerCase() as ShipType) || 0;
      if (actualCount !== required) {
        this.logger.warn(
          `Invalid ship count for ${shipType}: expected ${required}, got ${actualCount}`,
        );
        return false;
      }
    }

    // Проверяем размещение каждого корабля
    for (const ship of ships) {
      if (!this.isValidShipPlacement(board, ship)) {
        this.logger.warn(
          `Invalid ship placement for ${ship.type} at (${ship.x}, ${ship.y})`,
        );
        return false;
      }
    }

    // Проверяем отсутствие пересечений
    if (this.hasShipCollisions(ships)) {
      this.logger.warn('Ship collisions detected');
      return false;
    }

    return true;
  }

  private isValidShipPlacement(board: Board, ship: ShipPosition): boolean {
    const size =
      this.SHIP_SIZES[ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES];

    // Проверяем границы
    if (ship.direction === ShipDirection.HORIZONTAL) {
      if (
        ship.x + size > GAME_CONSTANTS.BOARD_SIZE ||
        ship.y >= GAME_CONSTANTS.BOARD_SIZE
      ) {
        return false;
      }
    } else {
      if (
        ship.x >= GAME_CONSTANTS.BOARD_SIZE ||
        ship.y + size > GAME_CONSTANTS.BOARD_SIZE
      ) {
        return false;
      }
    }

    return true;
  }

  private hasShipCollisions(ships: ShipPosition[]): boolean {
    const occupiedCells = new Set<string>();

    for (const ship of ships) {
      const size =
        this.SHIP_SIZES[
          ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES
        ];

      for (let i = 0; i < size; i++) {
        let x: number, y: number;

        if (ship.direction === ShipDirection.HORIZONTAL) {
          x = ship.x + i;
          y = ship.y;
        } else {
          x = ship.x;
          y = ship.y + i;
        }

        const cellKey = `${x},${y}`;
        if (occupiedCells.has(cellKey)) {
          return true;
        }
        occupiedCells.add(cellKey);
      }
    }

    return false;
  }

  placeShipsOnBoard(board: Board, ships: ShipPosition[]): Board {
    if (!this.validateShipPlacement(board, ships)) {
      throw new Error('Invalid ship placement');
    }

    const newBoard = new Board();
    newBoard.grid = board.grid.map((row) => row.map((cell) => ({ ...cell })));
    newBoard.ships = [];
    newBoard.playerId = board.playerId;

    for (const shipPosition of ships) {
      const ship = new Ship();
      ship.type = shipPosition.type;
      ship.position = shipPosition;
      ship.isSunk = false;

      // Размещаем корабль на доске
      const size =
        this.SHIP_SIZES[
          ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES
        ];
      for (let i = 0; i < size; i++) {
        let x: number, y: number;

        if (shipPosition.direction === ShipDirection.HORIZONTAL) {
          x = shipPosition.x + i;
          y = shipPosition.y;
        } else {
          x = shipPosition.x;
          y = shipPosition.y + i;
        }

        newBoard.grid[x][y].shipId = ship.type;
      }

      newBoard.ships.push(ship);
    }

    return newBoard;
  }

  processAttack(board: Board, x: number, y: number): AttackResult {
    if (
      x < 0 ||
      x >= GAME_CONSTANTS.BOARD_SIZE ||
      y < 0 ||
      y >= GAME_CONSTANTS.BOARD_SIZE
    ) {
      throw new Error(
        `Invalid coordinates: coordinates must be between 0 and ${GAME_CONSTANTS.BOARD_SIZE - 1}`,
      );
    }

    const cell = board.grid[x][y];
    if (cell.isHit) {
      throw new Error('Cell already hit');
    }

    cell.isHit = true;
    const hit = !!cell.shipId;

    if (hit) {
      const ship = board.ships.find((s) => s.type === cell.shipId);
      if (ship) {
        ship.isSunk = this.isShipSunk(board, ship);
        return {
          hit: true,
          sunk: ship.isSunk,
          shipId: ship.type,
        };
      }
    }

    return { hit: false, sunk: false };
  }

  private isShipSunk(board: Board, ship: Ship): boolean {
    const size =
      this.SHIP_SIZES[ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES];
    let hitCount = 0;

    for (let i = 0; i < size; i++) {
      let x: number, y: number;

      if (ship.position.direction === ShipDirection.HORIZONTAL) {
        x = ship.position.x + i;
        y = ship.position.y;
      } else {
        x = ship.position.x;
        y = ship.position.y + i;
      }

      if (board.grid[x][y].isHit) {
        hitCount++;
      }
    }

    return hitCount === size;
  }

  checkWinCondition(board: Board): boolean {
    return board.ships.every((ship) => ship.isSunk);
  }
}
