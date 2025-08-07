import { Ship } from './ship.model';

export class Board {
  grid: Cell[][]; // 10x10
  ships: Ship[];
  playerId: string;
}

export class Cell {
  x: number;
  y: number;
  isHit: boolean;
  shipId?: string; // если есть корабль
}
