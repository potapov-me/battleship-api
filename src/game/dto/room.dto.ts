import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus } from '../models/room.models';

export class CreateRoomDto {
  @ApiProperty({
    description: 'ID пользователя, создающего комнату',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Название комнаты (если не указано, будет создано автоматически)',
    example: 'Комната для игры',
  })
  name?: string;
}

export class JoinRoomDto {
  @ApiProperty({
    description: 'ID пользователя, присоединяющегося к комнате',
    example: '507f1f77bcf86cd799439012',
  })
  userId: string;
}

export class RoomResponseDto {
  @ApiProperty({
    description: 'Уникальный идентификатор комнаты',
    example: 'abc123def456',
  })
  id: string;

  @ApiProperty({
    description: 'Название комнаты',
    example: 'Комната для игры',
  })
  name: string;

  @ApiProperty({
    description: 'ID создателя комнаты',
    example: '507f1f77bcf86cd799439011',
  })
  creatorId: string;

  @ApiPropertyOptional({
    description: 'ID второго игрока (если присоединился)',
    example: '507f1f77bcf86cd799439012',
  })
  opponentId?: string;

  @ApiProperty({
    description: 'Статус комнаты',
    enum: RoomStatus,
    example: RoomStatus.Waiting,
  })
  status: RoomStatus;

  @ApiProperty({
    description: 'Дата создания комнаты',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Дата начала игры',
    example: '2024-01-15T10:35:00.000Z',
  })
  startedAt?: Date;

  @ApiPropertyOptional({
    description: 'Дата окончания игры',
    example: '2024-01-15T11:00:00.000Z',
  })
  finishedAt?: Date;
}

export class ActiveRoomsResponseDto {
  @ApiProperty({
    description: 'Список активных комнат',
    type: [RoomResponseDto],
  })
  rooms: RoomResponseDto[];
}

