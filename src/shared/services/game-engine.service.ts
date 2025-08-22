import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
        return false;
      }
    }

    // Проверяем размещение каждого корабля
    for (const ship of ships) {
      if (!this.isValidShipPlacement(board, ship)) {
        return false;
      }
    }

    // Проверяем отсутствие пересечений
    if (this.hasShipCollisions(ships)) {
      return false;
    }

    // Проверяем, что корабли не касаются друг друга
    if (this.hasAdjacentShips(ships)) {
      return false;
    }

    return true;
  }

  private isValidShipPlacement(board: Board, ship: ShipPosition): boolean {
    const size =
      this.SHIP_SIZES[ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES];

    if (!size) {
      this.logger.warn(`Unknown ship type: ${ship.type}`);
      return false;
    }

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

  private hasAdjacentShips(ships: ShipPosition[]): boolean {
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
        occupiedCells.add(`${x},${y}`);
      }
    }

    for (const ship of ships) {
      const size =
        this.SHIP_SIZES[
          ship.type.toUpperCase() as keyof typeof this.SHIP_SIZES
        ];
      const currentShipCells = new Set<string>();
      for (let i = 0; i < size; i++) {
        let x: number, y: number;
        if (ship.direction === ShipDirection.HORIZONTAL) {
          x = ship.x + i;
          y = ship.y;
        } else {
          x = ship.x;
          y = ship.y + i;
        }
        currentShipCells.add(`${x},${y}`);
      }

      for (let i = 0; i < size; i++) {
        let x: number, y: number;
        if (ship.direction === ShipDirection.HORIZONTAL) {
          x = ship.x + i;
          y = ship.y;
        } else {
          x = ship.x;
          y = ship.y + i;
        }

        const adjacentCells = [
          `${x + 1},${y}`,
          `${x - 1},${y}`,
          `${x},${y + 1}`,
          `${x},${y - 1}`,
          `${x + 1},${y + 1}`,
          `${x + 1},${y - 1}`,
          `${x - 1},${y + 1}`,
          `${x - 1},${y - 1}`,
        ];

        for (const adjacentCell of adjacentCells) {
          if (
            occupiedCells.has(adjacentCell) &&
            !currentShipCells.has(adjacentCell)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  placeShipsOnBoard(board: Board, ships: ShipPosition[]): Board {
    if (!this.validateShipPlacement(board, ships)) {
      throw new BadRequestException('Invalid ship placement');
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
      throw new BadRequestException(
        `Invalid coordinates: coordinates must be between 0 and ${GAME_CONSTANTS.BOARD_SIZE - 1}`,
      );
    }

    const cell = board.grid[x][y];
    if (cell.isHit) {
      throw new BadRequestException('Cell already hit');
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

  // Новый метод для получения статистики игры
  getGameStats(board: Board): {
    totalShips: number;
    sunkShips: number;
    remainingShips: number;
    hitCells: number;
    totalCells: number;
  } {
    const totalShips = board.ships.length;
    const sunkShips = board.ships.filter((ship) => ship.isSunk).length;
    const hitCells = board.grid.flat().filter((cell) => cell.isHit).length;
    const totalCells = GAME_CONSTANTS.BOARD_SIZE * GAME_CONSTANTS.BOARD_SIZE;

    return {
      totalShips,
      sunkShips,
      remainingShips: totalShips - sunkShips,
      hitCells,
      totalCells,
    };
  }
}
