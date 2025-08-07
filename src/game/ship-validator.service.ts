import { Injectable } from '@nestjs/common';
import { Board } from '../shared/models/board.model';
import { ShipType, Ship, ShipDirection } from '../shared/models/ship.model';

@Injectable()
export class ShipValidatorService {
  private readonly SHIP_RULES = {
    [ShipType.CARRIER]: { count: 1, size: 5 },
    [ShipType.BATTLESHIP]: { count: 1, size: 4 },
    [ShipType.CRUISER]: { count: 2, size: 3 },
    [ShipType.SUBMARINE]: { count: 1, size: 3 },
    [ShipType.DESTROYER]: { count: 2, size: 2 },
  };

  validate(
    ships: Ship[],
    board: Board,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.hasCorrectShipCounts(ships)) {
      errors.push('Invalid number of ships of a certain type.');
    }

    const allShipCoordinates = new Set<string>();

    for (const ship of ships) {
      const shipCoords = this.getShipCoordinates(ship);

      if (!this.isWithinBounds(shipCoords, board)) {
        errors.push(`Ship ${ship.type} is out of bounds.`);
      }

      for (const coord of shipCoords) {
        const coordStr = `${coord.x},${coord.y}`;
        if (allShipCoordinates.has(coordStr)) {
          errors.push(`Ships are overlapping at ${coordStr}.`);
        }
        allShipCoordinates.add(coordStr);
      }

      if (!this.hasValidSpacing(ship, allShipCoordinates)) {
        errors.push(`Ship ${ship.type} is too close to another ship.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private getShipCoordinates(ship: Ship): { x: number; y: number }[] {
    const coords: { x: number; y: number }[] = [];
    const shipSize = this.SHIP_RULES[ship.type].size;
    for (let i = 0; i < shipSize; i++) {
      const x =
        ship.position.direction === ShipDirection.HORIZONTAL
          ? ship.position.x + i
          : ship.position.x;
      const y =
        ship.position.direction === ShipDirection.VERTICAL
          ? ship.position.y + i
          : ship.position.y;
      coords.push({ x, y });
    }
    return coords;
  }

  private hasCorrectShipCounts(ships: Ship[]): boolean {
    const counts = ships.reduce(
      (acc, ship) => {
        acc[ship.type] = (acc[ship.type] || 0) + 1;
        return acc;
      },
      {} as Record<ShipType, number>,
    );

    for (const type in this.SHIP_RULES) {
      if (this.SHIP_RULES[type].count !== (counts[type] || 0)) {
        return false;
      }
    }
    return true;
  }

  private isWithinBounds(
    coords: { x: number; y: number }[],
    board: Board,
  ): boolean {
    const boardSize = board.grid.length;
    return coords.every(
      (c) => c.x >= 0 && c.x < boardSize && c.y >= 0 && c.y < boardSize,
    );
  }

  private hasValidSpacing(ship: Ship, allCoords: Set<string>): boolean {
    const shipCoords = this.getShipCoordinates(ship);
    for (const coord of shipCoords) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const adjacentCoord = `${coord.x + dx},${coord.y + dy}`;
          if (allCoords.has(adjacentCoord)) {
            // Check if the adjacent coordinate belongs to the *same* ship.
            // If it does, it's a valid part of the ship, not a spacing violation.
            const isSelf = shipCoords.some(
              (sc) => sc.x === coord.x + dx && sc.y === coord.y + dy,
            );
            if (!isSelf) {
              return false; // It's a different ship, and it's too close.
            }
          }
        }
      }
    }
    return true;
  }
}
