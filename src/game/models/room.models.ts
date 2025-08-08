import { User } from 'src/users/schemas/user.schema';

export enum RoomStatus {
  Waiting = 'waiting',
  Active = 'active',
  Finished = 'finished',
}

export class Room {
  id: string; // Уникальный идентификатор комнаты
  name: string; // Имя комнаты
  creator: User; // Создатель комнаты
  opponent?: User; // Второй игрок (опционально)
  status: RoomStatus; // Статус комнаты
  createdAt: Date; // Дата создания
  startedAt?: Date; // Дата начала
  finishedAt?: Date; // Дата окончания
}
