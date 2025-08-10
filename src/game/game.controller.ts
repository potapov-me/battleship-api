import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import {
  PlaceShipsDto,
  MakeShotDto,
  ShotResponseDto,
  GameResponseDto,
} from './dto/game.dto';
import { Game, GameStatus } from '../shared/models/game.model';

@ApiTags('Игровая логика')
@Controller('game')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly gameService: GameService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать новую игру',
    description: 'Создает новую игру между двумя игроками',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        player1Id: {
          type: 'string',
          description: 'ID первого игрока',
          example: '507f1f77bcf86cd799439011',
        },
        player2Id: {
          type: 'string',
          description: 'ID второго игрока',
          example: '507f1f77bcf86cd799439012',
        },
      },
      required: ['player1Id', 'player2Id'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Игра успешно создана',
    type: GameResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async createGame(
    @Body() body: { player1Id: string; player2Id: string },
  ): Promise<GameResponseDto> {
    try {
      const game = await this.gameService.createGame(
        body.player1Id,
        body.player2Id,
      );

      return {
        id: game.id,
        status: game.status,
        player1Id: game.player1.id,
        player2Id: game.player2.id,
        currentPlayerId: game.currentTurn,
      };
    } catch (error) {
      this.logger.error(`Failed to create game: ${error.message}`);
      throw new BadRequestException('Не удалось создать игру');
    }
  }

  @Post('place-ships')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Разместить корабли',
    description: 'Размещает корабли на доске для указанного игрока',
  })
  @ApiBody({ type: PlaceShipsDto })
  @ApiResponse({
    status: 200,
    description: 'Корабли успешно размещены',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Корабли размещены успешно' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры размещения кораблей',
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async placeShips(
    @Body() placeShipsDto: PlaceShipsDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.gameService.placeShips(
        placeShipsDto.gameId,
        placeShipsDto.userId,
        placeShipsDto.ships,
      );

      if (result.success) {
        return {
          success: true,
          message: 'Корабли размещены успешно',
        };
      } else {
        throw new BadRequestException('Не удалось разместить корабли');
      }
    } catch (error) {
      this.logger.error(`Failed to place ships: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Не удалось разместить корабли');
    }
  }

  @Post('make-shot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Сделать выстрел',
    description: 'Выполняет выстрел по указанным координатам',
  })
  @ApiBody({ type: MakeShotDto })
  @ApiResponse({
    status: 200,
    description: 'Выстрел выполнен',
    type: ShotResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры выстрела или не ваш ход',
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async makeShot(@Body() makeShotDto: MakeShotDto): Promise<ShotResponseDto> {
    try {
      const result = await this.gameService.makeShot(
        makeShotDto.gameId,
        makeShotDto.userId,
        makeShotDto.x,
        makeShotDto.y,
      );

      return {
        hit: result.hit,
        sunk: result.sunk,
        gameOver: result.gameOver,
      };
    } catch (error) {
      this.logger.error(`Failed to make shot: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Не удалось выполнить выстрел');
    }
  }

  @Get(':gameId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить информацию об игре',
    description: 'Возвращает текущее состояние игры',
  })
  @ApiParam({
    name: 'gameId',
    description: 'ID игры',
    example: 'game123',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация об игре получена',
    type: GameResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getGame(@Param('gameId') gameId: string): Promise<GameResponseDto> {
    try {
      const game = await this.gameService.getGame(gameId);

      if (!game) {
        throw new NotFoundException('Игра не найдена');
      }

      return {
        id: game.id,
        status: game.status,
        player1Id: game.player1.id,
        player2Id: game.player2.id,
        currentPlayerId: game.currentTurn,
        winnerId: game.winner?.id,
      };
    } catch (error) {
      this.logger.error(`Failed to get game ${gameId}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Не удалось получить информацию об игре');
    }
  }

  @Get('player/:playerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить игры игрока',
    description: 'Возвращает список всех игр указанного игрока',
  })
  @ApiParam({
    name: 'playerId',
    description: 'ID игрока',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Список игр получен',
    type: [GameResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getGamesByPlayer(
    @Param('playerId') playerId: string,
  ): Promise<GameResponseDto[]> {
    try {
      const games = await this.gameService.getGamesByPlayer(playerId);

      return games.map((game) => ({
        id: game.id,
        status: game.status,
        player1Id: game.player1.id,
        player2Id: game.player2.id,
        currentPlayerId: game.currentTurn,
        winnerId: game.winner?.id,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get games for player ${playerId}: ${error.message}`,
      );
      throw new BadRequestException('Не удалось получить список игр');
    }
  }

  @Get('active/list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить активные игры',
    description: 'Возвращает список всех активных игр',
  })
  @ApiResponse({
    status: 200,
    description: 'Список активных игр получен',
    type: [GameResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getActiveGames(): Promise<GameResponseDto[]> {
    try {
      const games = await this.gameService.getActiveGames();

      return games.map((game) => ({
        id: game.id,
        status: game.status,
        player1Id: game.player1.id,
        player2Id: game.player2.id,
        currentPlayerId: game.currentTurn,
        winnerId: game.winner?.id,
      }));
    } catch (error) {
      this.logger.error(`Failed to get active games: ${error.message}`);
      throw new BadRequestException('Не удалось получить список активных игр');
    }
  }

  @Post(':gameId/surrender')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Сдаться в игре',
    description: 'Позволяет игроку сдаться в текущей игре',
  })
  @ApiParam({
    name: 'gameId',
    description: 'ID игры',
    example: 'game123',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID игрока, который сдается',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Игрок успешно сдался',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Игрок сдался' },
        winnerId: { type: 'string', example: '507f1f77bcf86cd799439012' },
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
  async surrender(
    @Param('gameId') gameId: string,
    @Body() body: { userId: string },
  ): Promise<{ success: boolean; message: string; winnerId: string }> {
    try {
      const game = await this.gameService.getGame(gameId);

      if (!game) {
        throw new NotFoundException('Игра не найдена');
      }

      if (game.status !== GameStatus.ACTIVE) {
        throw new BadRequestException('Нельзя сдаться в неактивной игре');
      }

      if (game.player1.id !== body.userId && game.player2.id !== body.userId) {
        throw new BadRequestException('Игрок не является участником этой игры');
      }

      // Определяем победителя (противник сдающегося игрока)
      const winnerId =
        game.player1.id === body.userId ? game.player2.id : game.player1.id;

      // TODO: Здесь можно добавить логику завершения игры через gameService
      // await this.gameService.endGame(gameId, winnerId);

      return {
        success: true,
        message: 'Игрок сдался',
        winnerId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to surrender in game ${gameId}: ${error.message}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Не удалось обработать сдачу');
    }
  }
}
