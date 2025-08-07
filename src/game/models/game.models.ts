import { User } from 'src/users/models/user.models';
import { Room } from './room.models';

export enum GameStatus {
  Placing = 'placing', // Игроки расставляют корабли
  Battle = 'battle', // Игра в процессе
  Finished = 'finished', // Игра завершена
}

export class Game {
  id: string; // Уникальный идентификатор игры
  room: Room; // Комната, в которой идет игра
  player1: User; // Первый игрок
  player2: User; // Второй игрок
  currentTurn: User; // Чей сейчас ход
  status: GameStatus; // Статус игры
  winner?: User; // Победитель (опционально)
}
