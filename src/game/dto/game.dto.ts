import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
        size: { type: 'number', example: 4 },
        orientation: { type: 'string', enum: ['horizontal', 'vertical'], example: 'horizontal' },
      },
    },
    example: [
      { x: 0, y: 0, size: 4, orientation: 'horizontal' },
      { x: 2, y: 2, size: 3, orientation: 'vertical' },
    ],
  })
  ships: Array<{
    x: number;
    y: number;
    size: number;
    orientation: 'horizontal' | 'vertical';
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

