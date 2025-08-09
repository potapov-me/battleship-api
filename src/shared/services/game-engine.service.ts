import { Injectable, Logger } from '@nestjs/common';
import { IGameEngine } from '../interfaces/game-engine.interface';
import { Board, Cell } from '../models/board.model';
import { Ship, ShipType, ShipPosition, ShipDirection } from '../models/ship.model';

@Injectable()
export class GameEngineService implements IGameEngine {
  private readonly logger = new Logger(GameEngineService.name);

  private readonly SHIP_SIZES = {
    [ShipType.CARRIER]: 5,
    [ShipType.BATTLESHIP]: 4,
    [ShipType.CRUISER]: 3,
    [ShipType.SUBMARINE]: 3,
    [ShipType.DESTROYER]: 2,
  };

  private readonly REQUIRED_SHIPS = {
    [ShipType.CARRIER]: 1,
    [ShipType.BATTLESHIP]: 1,
    [ShipType.CRUISER]: 1,
    [ShipType.SUBMARINE]: 1,
    [ShipType.DESTROYER]: 1,
  };

  generateEmptyBoard(): Board {
    const board = new Board();
    board.grid = [];
    board.ships = [];
    board.playerId = '';

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
    if (!ships || ships.length === 0) {
      return false;
    }

    // Проверяем количество кораблей каждого типа
    const shipCounts = new Map<ShipType, number>();
    for (const ship of ships) {
      const shipType = ship.type as ShipType;
      shipCounts.set(shipType, (shipCounts.get(shipType) || 0) + 1);
    }

    for (const [shipType, required] of Object.entries(this.REQUIRED_SHIPS)) {
      if ((shipCounts.get(shipType as ShipType) || 0) !== required) {
        this.logger.warn(`Invalid ship count for ${shipType}`);
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
    return !this.hasShipCollisions(ships);
  }

  private isValidShipPlacement(board: Board, ship: ShipPosition): boolean {
    const size = this.SHIP_SIZES[ship.type as ShipType];
    
    // Проверяем границы
    if (ship.direction === ShipDirection.HORIZONTAL) {
      if (ship.x + size > 10 || ship.y >= 10) {
        return false;
      }
    } else {
      if (ship.x >= 10 || ship.y + size > 10) {
        return false;
      }
    }

    return true;
  }

  private hasShipCollisions(ships: ShipPosition[]): boolean {
    const occupiedCells = new Set<string>();

    for (const ship of ships) {
      const size = this.SHIP_SIZES[ship.type as ShipType];
      
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

    const newBoard = { ...board };
    newBoard.ships = [];

    for (const shipPosition of ships) {
      const ship = new Ship();
      ship.type = shipPosition.type as ShipType;
      ship.position = shipPosition;
      ship.isSunk = false;

      // Размещаем корабль на доске
      const size = this.SHIP_SIZES[ship.type];
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

  processAttack(board: Board, x: number, y: number): { hit: boolean; sunk: boolean; shipId?: string } {
    if (x < 0 || x >= 10 || y < 0 || y >= 10) {
      throw new Error('Invalid coordinates');
    }

    const cell = board.grid[x][y];
    if (cell.isHit) {
      throw new Error('Cell already hit');
    }

    cell.isHit = true;
    const hit = !!cell.shipId;

    if (hit) {
      const ship = board.ships.find(s => s.type === cell.shipId);
      if (ship) {
        ship.isSunk = this.isShipSunk(board, ship);
        return {
          hit: true,
          sunk: ship.isSunk,
          shipId: ship.type
        };
      }
    }

    return { hit: false, sunk: false };
  }

  private isShipSunk(board: Board, ship: Ship): boolean {
    const size = this.SHIP_SIZES[ship.type];
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
    return board.ships.every(ship => ship.isSunk);
  }
}
