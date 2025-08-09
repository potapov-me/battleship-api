import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from './models/room.models';

export interface RoomEntity {
  id: string;
  name: string;
  creatorId: string;
  opponentId?: string;
  status: RoomStatus;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

@Injectable()
export class RoomService {
  private readonly roomsById = new Map<string, RoomEntity>();

  createRoom(userId: string, name?: string): RoomEntity {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const id = this.generateId();
    const room: RoomEntity = {
      id,
      name: name ?? `Room of ${userId}`,
      creatorId: userId,
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };
    this.roomsById.set(id, room);
    return room;
  }

  joinRoom(roomId: string, userId: string): RoomEntity {
    const room = this.roomsById.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    if (room.status !== RoomStatus.Waiting) {
      throw new BadRequestException('Room is not joinable');
    }
    if (room.creatorId === userId) {
      throw new BadRequestException('Creator cannot join their own room as opponent');
    }
    if (room.opponentId) {
      throw new BadRequestException('Room already has an opponent');
    }
    room.opponentId = userId;
    return room;
  }

  startGame(roomId: string): RoomEntity {
    const room = this.roomsById.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.status !== RoomStatus.Waiting) {
      throw new BadRequestException('Game has already started or finished');
    }
    if (!room.opponentId) {
      throw new BadRequestException('Cannot start game without an opponent');
    }
    room.status = RoomStatus.Active;
    room.startedAt = new Date();
    return room;
  }

  finishGame(roomId: string): RoomEntity {
    const room = this.roomsById.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.status === RoomStatus.Finished) {
      return room;
    }
    room.status = RoomStatus.Finished;
    room.finishedAt = new Date();
    return room;
  }

  getRoom(roomId: string): RoomEntity {
    const room = this.roomsById.get(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  getActiveRooms(): RoomEntity[] {
    // Rooms available to join
    return Array.from(this.roomsById.values()).filter(
      (r) => r.status === RoomStatus.Waiting,
    );
  }

  listRooms(): RoomEntity[] {
    return Array.from(this.roomsById.values());
  }

  clearAll(): void {
    // For tests
    this.roomsById.clear();
  }

  private generateId(): string {
    // Simple unique id without extra deps
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    ).toLowerCase();
  }
}
