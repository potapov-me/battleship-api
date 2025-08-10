import { Injectable, BadRequestException } from '@nestjs/common';
import { ShipPosition, ShipType } from '../models/ship.model';

@Injectable()
export class GameValidatorService {
  private readonly BOARD_SIZE = 10;
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

  validateShipPlacement(ships: ShipPosition[]): void {
    if (!ships || ships.length === 0) {
      throw new BadRequestException('Ships array is required');
    }

    // Проверяем количество кораблей каждого типа
    const shipCounts = new Map<ShipType, number>();
    for (const ship of ships) {
      const shipType = ship.type;
      shipCounts.set(shipType, (shipCounts.get(shipType) || 0) + 1);
    }

    for (const [shipType, required] of Object.entries(this.REQUIRED_SHIPS)) {
      if ((shipCounts.get(shipType as ShipType) || 0) !== required) {
        throw new BadRequestException(
          `Invalid ship count for ${shipType}. Expected ${required}, got ${shipCounts.get(shipType as ShipType) || 0}`,
        );
      }
    }

    // Проверяем размещение каждого корабля
    for (const ship of ships) {
      this.validateSingleShipPlacement(ship);
    }

    // Проверяем отсутствие пересечений
    if (this.hasShipCollisions(ships)) {
      throw new BadRequestException('Ships cannot overlap');
    }
  }

  validateShotCoordinates(x: number, y: number): void {
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new BadRequestException('Coordinates must be numbers');
    }

    if (x < 0 || x >= this.BOARD_SIZE || y < 0 || y >= this.BOARD_SIZE) {
      throw new BadRequestException(
        `Coordinates must be between 0 and ${this.BOARD_SIZE - 1}`,
      );
    }
  }

  validateGameId(gameId: string): void {
    if (!gameId || typeof gameId !== 'string') {
      throw new BadRequestException('Valid game ID is required');
    }

    if (gameId.length < 10) {
      throw new BadRequestException('Game ID is too short');
    }
  }

  validatePlayerId(playerId: string): void {
    if (!playerId || typeof playerId !== 'string') {
      throw new BadRequestException('Valid player ID is required');
    }
  }

  private validateSingleShipPlacement(ship: ShipPosition): void {
    const size = this.SHIP_SIZES[ship.type];

    if (ship.direction === 'horizontal') {
      if (ship.x + size > this.BOARD_SIZE || ship.y >= this.BOARD_SIZE) {
        throw new BadRequestException(
          `Ship ${ship.type} at (${ship.x}, ${ship.y}) goes outside board boundaries`,
        );
      }
    } else {
      if (ship.x >= this.BOARD_SIZE || ship.y + size > this.BOARD_SIZE) {
        throw new BadRequestException(
          `Ship ${ship.type} at (${ship.x}, ${ship.y}) goes outside board boundaries`,
        );
      }
    }
  }

  private hasShipCollisions(ships: ShipPosition[]): boolean {
    const occupiedCells = new Set<string>();

    for (const ship of ships) {
      const size = this.SHIP_SIZES[ship.type];

      for (let i = 0; i < size; i++) {
        let x: number, y: number;

        if (ship.direction === 'horizontal') {
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
}
