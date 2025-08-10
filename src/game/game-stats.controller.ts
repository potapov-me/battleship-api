import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { GameStatus } from '../shared/models/game.model';

@ApiTags('Статистика игр')
@Controller('game-stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GameStatsController {
  private readonly logger = new Logger(GameStatsController.name);

  constructor(private readonly gameService: GameService) {}

  @Get('player/:playerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить статистику игрока',
    description: 'Возвращает статистику игр для указанного игрока',
  })
  @ApiParam({
    name: 'playerId',
    description: 'ID игрока',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика игрока получена',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        totalGames: { type: 'number', example: 25 },
        wins: { type: 'number', example: 15 },
        losses: { type: 'number', example: 8 },
        draws: { type: 'number', example: 2 },
        winRate: { type: 'number', example: 60.0 },
        averageGameDuration: { type: 'number', example: 1800 },
        totalShots: { type: 'number', example: 150 },
        accuracy: { type: 'number', example: 75.5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getPlayerStats(@Param('playerId') playerId: string) {
    try {
      this.logger.log(`Fetching stats for player ${playerId}`);

      const games = await this.gameService.getGamesByPlayer(playerId);

      const totalGames = games.length;
      const wins = games.filter((game) => game.winner?.id === playerId).length;
      const losses = games.filter(
        (game) =>
          game.winner &&
          game.winner.id !== playerId &&
          game.status === GameStatus.FINISHED,
      ).length;
      const draws = totalGames - wins - losses;
      const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

      // Здесь можно добавить более детальную логику расчета статистики
      // например, среднюю продолжительность игры, точность выстрелов и т.д.

      return {
        playerId,
        totalGames,
        wins,
        losses,
        draws,
        winRate: Math.round(winRate * 100) / 100,
        averageGameDuration: 0, // TODO: реализовать расчет
        totalShots: 0, // TODO: реализовать расчет
        accuracy: 0, // TODO: реализовать расчет
      };
    } catch (error) {
      this.logger.error(
        `Failed to get stats for player ${playerId}: ${error.message}`,
      );
      throw new BadRequestException('Не удалось получить статистику игрока');
    }
  }

  @Get('leaderboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить таблицу лидеров',
    description: 'Возвращает топ игроков по количеству побед',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Количество игроков в топе',
    required: false,
    type: 'number',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Таблица лидеров получена',
    schema: {
      type: 'object',
      properties: {
        leaderboard: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number', example: 1 },
              playerId: { type: 'string' },
              username: { type: 'string' },
              wins: { type: 'number', example: 25 },
              totalGames: { type: 'number', example: 30 },
              winRate: { type: 'number', example: 83.3 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getLeaderboard(@Query('limit') limit: number = 10) {
    try {
      this.logger.log(`Fetching leaderboard with limit ${limit}`);

      // TODO: Здесь можно реализовать логику получения таблицы лидеров
      // например, через отдельный сервис статистики
      // const leaderboard = await this.gameService.getLeaderboard(limit);

      // Временная заглушка
      const leaderboard = [
        {
          rank: 1,
          playerId: 'player1',
          username: 'Player1',
          wins: 25,
          totalGames: 30,
          winRate: 83.3,
        },
        {
          rank: 2,
          playerId: 'player2',
          username: 'Player2',
          wins: 20,
          totalGames: 28,
          winRate: 71.4,
        },
      ];

      return { leaderboard: leaderboard.slice(0, limit) };
    } catch (error) {
      this.logger.error(`Failed to get leaderboard: ${error.message}`);
      throw new BadRequestException('Не удалось получить таблицу лидеров');
    }
  }

  @Get('game/:gameId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить статистику конкретной игры',
    description: 'Возвращает детальную статистику указанной игры',
  })
  @ApiParam({
    name: 'gameId',
    description: 'ID игры',
    example: 'game123',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика игры получена',
    schema: {
      type: 'object',
      properties: {
        gameId: { type: 'string' },
        duration: { type: 'number', example: 1800 },
        totalShots: { type: 'number', example: 45 },
        player1Stats: {
          type: 'object',
          properties: {
            shots: { type: 'number', example: 23 },
            hits: { type: 'number', example: 18 },
            accuracy: { type: 'number', example: 78.3 },
          },
        },
        player2Stats: {
          type: 'object',
          properties: {
            shots: { type: 'number', example: 22 },
            hits: { type: 'number', example: 15 },
            accuracy: { type: 'number', example: 68.2 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры запроса',
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getGameStats(@Param('gameId') gameId: string) {
    try {
      this.logger.log(`Fetching stats for game ${gameId}`);

      const game = await this.gameService.getGame(gameId);

      if (!game) {
        throw new BadRequestException('Игра не найдена');
      }

      // Здесь можно реализовать логику расчета статистики игры
      // например, количество выстрелов, точность, продолжительность и т.д.

      return {
        gameId,
        duration: 0, // TODO: реализовать расчет
        totalShots: 0, // TODO: реализовать расчет
        player1Stats: {
          shots: 0,
          hits: 0,
          accuracy: 0,
        },
        player2Stats: {
          shots: 0,
          hits: 0,
          accuracy: 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get stats for game ${gameId}: ${error.message}`,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Не удалось получить статистику игры');
    }
  }

  @Get('global/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить глобальную статистику',
    description: 'Возвращает общую статистику по всем играм',
  })
  @ApiResponse({
    status: 200,
    description: 'Глобальная статистика получена',
    schema: {
      type: 'object',
      properties: {
        totalGames: { type: 'number', example: 1250 },
        activeGames: { type: 'number', example: 15 },
        totalPlayers: { type: 'number', example: 450 },
        averageGameDuration: { type: 'number', example: 1800 },
        totalShots: { type: 'number', example: 12500 },
        averageAccuracy: { type: 'number', example: 72.5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getGlobalStats() {
    try {
      this.logger.log('Fetching global stats');

      const activeGames = await this.gameService.getActiveGames();

      // Здесь можно реализовать логику получения глобальной статистики
      // например, через отдельный сервис статистики или базу данных

      return {
        totalGames: 0, // TODO: реализовать получение
        activeGames: activeGames.length,
        totalPlayers: 0, // TODO: реализовать получение
        averageGameDuration: 0, // TODO: реализовать расчет
        totalShots: 0, // TODO: реализовать получение
        averageAccuracy: 0, // TODO: реализовать расчет
      };
    } catch (error) {
      this.logger.error(`Failed to get global stats: ${error.message}`);
      throw new BadRequestException(
        'Не удалось получить глобальную статистику',
      );
    }
  }
}
