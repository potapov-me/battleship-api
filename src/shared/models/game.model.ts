import { User } from 'src/users/models/user.models';
import { Board } from './board.model';

export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  FINISHED = 'finished',
}

export class Game {
  id: string;
  player1: User;
  player2: User;
  board1: Board;
  board2: Board;
  currentTurn: string; // ID игрока
  status: GameStatus;
}
