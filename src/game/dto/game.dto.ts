import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShipType, ShipDirection } from '../../shared/models/ship.model';

export class PlaceShipsDto {
  @ApiProperty({
    description: 'ID игры',
    example: 'game123',
  })
  gameId: string;

  @ApiProperty({
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'Массив позиций кораблей',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        x: { type: 'number', example: 0 },
        y: { type: 'number', example: 0 },
        type: {
          type: 'string',
          enum: Object.values(ShipType),
          example: ShipType.BATTLESHIP,
          description: 'Тип корабля',
        },
        direction: {
          type: 'string',
          enum: Object.values(ShipDirection),
          example: ShipDirection.HORIZONTAL,
          description: 'Направление корабля',
        },
      },
    },
    example: [
      {
        x: 0,
        y: 0,
        type: ShipType.BATTLESHIP,
        direction: ShipDirection.HORIZONTAL,
      },
      { x: 2, y: 2, type: ShipType.CRUISER, direction: ShipDirection.VERTICAL },
    ],
  })
  ships: Array<{
    x: number;
    y: number;
    type: ShipType;
    direction: ShipDirection;
  }>;
}

export class MakeShotDto {
  @ApiProperty({
    description: 'ID игры',
    example: 'game123',
  })
  gameId: string;

  @ApiProperty({
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'X координата выстрела',
    example: 5,
    minimum: 0,
    maximum: 9,
  })
  x: number;

  @ApiProperty({
    description: 'Y координата выстрела',
    example: 3,
    minimum: 0,
    maximum: 9,
  })
  y: number;
}

export class ShotResponseDto {
  @ApiProperty({
    description: 'Попал ли выстрел',
    example: true,
  })
  hit: boolean;

  @ApiPropertyOptional({
    description: 'Потоплен ли корабль',
    example: false,
  })
  sunk?: boolean;

  @ApiPropertyOptional({
    description: 'Игра окончена',
    example: false,
  })
  gameOver?: boolean;

  @ApiPropertyOptional({
    description: 'ID победителя',
    example: '507f1f77bcf86cd799439011',
  })
  winner?: string;
}

export class GameResponseDto {
  @ApiProperty({
    description: 'ID игры',
    example: 'game123',
  })
  id: string;

  @ApiProperty({
    description: 'Статус игры',
    enum: ['waiting', 'active', 'finished'],
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'ID игрока 1',
    example: '507f1f77bcf86cd799439011',
  })
  player1Id: string;

  @ApiPropertyOptional({
    description: 'ID игрока 2',
    example: '507f1f77bcf86cd799439012',
  })
  player2Id?: string;

  @ApiPropertyOptional({
    description: 'ID текущего игрока',
    example: '507f1f77bcf86cd799439011',
  })
  currentPlayerId?: string;

  @ApiPropertyOptional({
    description: 'ID победителя',
    example: '507f1f77bcf86cd799439011',
  })
  winnerId?: string;
}
