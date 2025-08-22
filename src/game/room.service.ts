import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoomStatus } from './models/room.models';
import { RedisService } from '../shared/redis.service';
import { RoomResponseDto } from './dto/room.dto';

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

  private toRoomResponseDto(room: RoomEntity): RoomResponseDto {
    const players = [room.creatorId];
    if (room.opponentId) {
      players.push(room.opponentId);
    }
    return {
      ...room,
      players,
    };
  }

  async createRoom(userId: string, name?: string): Promise<RoomResponseDto> {
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
    return this.toRoomResponseDto(room);
  }

  async joinRoom(roomId: string, userId: string): Promise<RoomResponseDto> {
    const room = await this.getRoomEntity(roomId);
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
    return this.toRoomResponseDto(room);
  }

  async startGame(roomId: string): Promise<RoomResponseDto> {
    const room = await this.getRoomEntity(roomId);
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
    return this.toRoomResponseDto(room);
  }

  async finishGame(roomId: string): Promise<RoomResponseDto> {
    const room = await this.getRoomEntity(roomId);
    if (room.status === RoomStatus.Finished) {
      return this.toRoomResponseDto(room);
    }

    room.status = RoomStatus.Finished;
    room.finishedAt = new Date();
    const roomKey = this.getRoomKey(roomId);
    await this.redisService.set(roomKey, room, this.ROOM_TTL);
    return this.toRoomResponseDto(room);
  }

  async getRoom(roomId: string): Promise<RoomResponseDto> {
    const room = await this.getRoomEntity(roomId);
    return this.toRoomResponseDto(room);
  }

  private async getRoomEntity(roomId: string): Promise<RoomEntity> {
    const roomKey = this.getRoomKey(roomId);
    const room = await this.redisService.get<RoomEntity>(roomKey);
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async getActiveRooms(): Promise<RoomResponseDto[]> {
    const roomKeys = await this.redisService.keys(`${this.ROOM_KEY_PREFIX}*`);
    const rooms: RoomResponseDto[] = [];

    for (const key of roomKeys) {
      const room = await this.redisService.get<RoomEntity>(key);
      if (room && room.status === RoomStatus.Waiting) {
        rooms.push(this.toRoomResponseDto(room));
      }
    }

    return rooms;
  }

  async listRooms(): Promise<RoomResponseDto[]> {
    const roomKeys = await this.redisService.keys(`${this.ROOM_KEY_PREFIX}*`);
    const rooms: RoomResponseDto[] = [];

    for (const key of roomKeys) {
      const room = await this.redisService.get<RoomEntity>(key);
      if (room) {
        rooms.push(this.toRoomResponseDto(room));
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
