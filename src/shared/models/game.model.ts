import { Board } from './board.model';
import { User } from 'src/users/schemas/user.schema';

export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export class Game {
  id: string;
  player1: User;
  player2: User;
  board1: Board;
  board2: Board;
  currentTurn: string; // ID игрока
  status: GameStatus;
  winner?: User;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  lastActivityAt: Date;
  settings?: GameSettings;
}

export interface GameSettings {
  boardSize: number;
  shipTypes: ShipTypeConfig[];
  timeLimit?: number; // в секундах
  allowSpectators: boolean;
}

export interface ShipTypeConfig {
  type: string;
  size: number;
  count: number;
}
