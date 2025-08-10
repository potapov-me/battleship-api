import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from './models/room.models';
import { RedisService } from '../shared/redis.service';

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
  private readonly ROOM_KEY_PREFIX = 'room:';
  private readonly ROOM_TTL = 24 * 60 * 60; // 24 hours in seconds

  constructor(private readonly redisService: RedisService) {}

  async createRoom(userId: string, name?: string): Promise<RoomEntity> {
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

    const roomKey = this.getRoomKey(id);
    await this.redisService.set(roomKey, room, this.ROOM_TTL);
    return room;
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomEntity> {
    const room = await this.getRoom(roomId);
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    if (room.status !== RoomStatus.Waiting) {
      throw new BadRequestException('Room is not joinable');
    }
    if (room.creatorId === userId) {
      throw new BadRequestException(
        'Creator cannot join their own room as opponent',
      );
    }
    if (room.opponentId) {
      throw new BadRequestException('Room already has an opponent');
    }

    room.opponentId = userId;
    const roomKey = this.getRoomKey(roomId);
    await this.redisService.set(roomKey, room, this.ROOM_TTL);
    return room;
  }

  async startGame(roomId: string): Promise<RoomEntity> {
    const room = await this.getRoom(roomId);
    if (room.status !== RoomStatus.Waiting) {
      throw new BadRequestException('Game has already started or finished');
    }
    if (!room.opponentId) {
      throw new BadRequestException('Cannot start game without an opponent');
    }

    room.status = RoomStatus.Active;
    room.startedAt = new Date();
    const roomKey = this.getRoomKey(roomId);
    await this.redisService.set(roomKey, room, this.ROOM_TTL);
    return room;
  }

  async finishGame(roomId: string): Promise<RoomEntity> {
    const room = await this.getRoom(roomId);
    if (room.status === RoomStatus.Finished) {
      return room;
    }

    room.status = RoomStatus.Finished;
    room.finishedAt = new Date();
    const roomKey = this.getRoomKey(roomId);
    await this.redisService.set(roomKey, room, this.ROOM_TTL);
    return room;
  }

  async getRoom(roomId: string): Promise<RoomEntity> {
    const roomKey = this.getRoomKey(roomId);
    const room = await this.redisService.get<RoomEntity>(roomKey);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async getActiveRooms(): Promise<RoomEntity[]> {
    const roomKeys = await this.redisService.keys(`${this.ROOM_KEY_PREFIX}*`);
    const rooms: RoomEntity[] = [];

    for (const key of roomKeys) {
      const room = await this.redisService.get<RoomEntity>(key);
      if (room && room.status === RoomStatus.Waiting) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  async listRooms(): Promise<RoomEntity[]> {
    const roomKeys = await this.redisService.keys(`${this.ROOM_KEY_PREFIX}*`);
    const rooms: RoomEntity[] = [];

    for (const key of roomKeys) {
      const room = await this.redisService.get<RoomEntity>(key);
      if (room) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  async clearAll(): Promise<void> {
    const roomKeys = await this.redisService.keys(`${this.ROOM_KEY_PREFIX}*`);
    for (const key of roomKeys) {
      await this.redisService.del(key);
    }
  }

  private getRoomKey(roomId: string): string {
    return `${this.ROOM_KEY_PREFIX}${roomId}`;
  }

  private generateId(): string {
    // Simple unique id without extra deps
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
    ).toLowerCase();
  }
}
