import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEmail,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlayerDto {
  @ApiProperty({ description: 'Username игрока', minLength: 3, maxLength: 30 })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({ description: 'Email игрока' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Пароль игрока', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Роли игрока',
    type: [String],
    default: ['player'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ description: 'Биография игрока', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL аватара игрока' })
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class UpdatePlayerDto {
  @ApiPropertyOptional({
    description: 'Username игрока',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @ApiPropertyOptional({ description: 'Email игрока' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Пароль игрока', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ description: 'Роли игрока', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({ description: 'Биография игрока', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL аватара игрока' })
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Статус активности игрока' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PlayerResponseDto {
  @ApiProperty({ description: 'ID игрока' })
  id: string;

  @ApiProperty({ description: 'Username игрока' })
  username: string;

  @ApiProperty({ description: 'Email игрока' })
  email: string;

  @ApiProperty({ description: 'Роли игрока', type: [String] })
  roles: string[];

  @ApiProperty({ description: 'Статус подтверждения email' })
  isEmailConfirmed: boolean;

  @ApiProperty({ description: 'Статус активности игрока' })
  isActive: boolean;

  @ApiProperty({ description: 'Рейтинг игрока' })
  rating: number;

  @ApiProperty({ description: 'Общее количество игр' })
  totalGames: number;

  @ApiProperty({ description: 'Количество побед' })
  wins: number;

  @ApiProperty({ description: 'Количество поражений' })
  losses: number;

  @ApiProperty({ description: 'Процент побед' })
  winRate: number;

  @ApiPropertyOptional({ description: 'Биография игрока' })
  bio?: string;

  @ApiPropertyOptional({ description: 'URL аватара игрока' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'Дата последнего входа' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Дата создания аккаунта' })
  createdAt: Date;

  @ApiProperty({ description: 'Дата последнего обновления' })
  updatedAt: Date;
}

export class PlayerStatsDto {
  @ApiProperty({ description: 'ID игрока' })
  id: string;

  @ApiProperty({ description: 'Username игрока' })
  username: string;

  @ApiProperty({ description: 'Общее количество игр' })
  totalGames: number;

  @ApiProperty({ description: 'Количество побед' })
  wins: number;

  @ApiProperty({ description: 'Количество поражений' })
  losses: number;

  @ApiProperty({ description: 'Процент побед' })
  winRate: number;

  @ApiProperty({ description: 'Текущий рейтинг' })
  rating: number;

  @ApiProperty({ description: 'Средний рейтинг противников' })
  averageOpponentRating: number;

  @ApiProperty({ description: 'Лучший рейтинг' })
  bestRating: number;

  @ApiProperty({ description: 'Количество игр за последние 30 дней' })
  gamesLast30Days: number;
}

export class PlayerListResponseDto {
  @ApiProperty({ description: 'Список игроков', type: [PlayerResponseDto] })
  players: PlayerResponseDto[];

  @ApiProperty({ description: 'Общее количество игроков' })
  total: number;

  @ApiProperty({ description: 'Номер страницы' })
  page: number;

  @ApiProperty({ description: 'Размер страницы' })
  limit: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages: number;

  @ApiProperty({ description: 'Есть ли следующая страница' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Есть ли предыдущая страница' })
  hasPrevPage: boolean;
}

export class PlayerSearchDto {
  @ApiPropertyOptional({
    description: 'Поисковый запрос по username или email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Минимальный рейтинг' })
  @IsOptional()
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ description: 'Максимальный рейтинг' })
  @IsOptional()
  @IsNumber()
  maxRating?: number;

  @ApiPropertyOptional({ description: 'Статус подтверждения email' })
  @IsOptional()
  @IsBoolean()
  isEmailConfirmed?: boolean;

  @ApiPropertyOptional({ description: 'Статус активности' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Сортировка',
    enum: ['rating', 'totalGames', 'wins', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Порядок сортировки',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}
