export enum ShipType {
  CARRIER = 'carrier', // Авианосец 5 клеток
  BATTLESHIP = 'battleship', // Броненосец 4 клетки
  CRUISER = 'cruiser', // Крейсер 3 клетки
  SUBMARINE = 'submarine', // Подводная лодка 3 клетки
  DESTROYER = 'destroyer', // Эсминец 2 клетки
}

export enum ShipDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export interface ShipPosition {
  x: number;
  y: number;
  direction: ShipDirection;
}

export class Ship {
  type: ShipType;
  position: ShipPosition;
  isSunk: boolean;
}
