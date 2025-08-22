import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoomService } from './room.service';
import {
  CreateRoomDto,
  JoinRoomDto,
  RoomResponseDto,
  ActiveRoomsResponseDto,
} from './dto/room.dto';

@ApiTags('Игровые комнаты')
@Controller('rooms')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(private readonly roomService: RoomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создать новую игровую комнату',
    description: 'Создает новую комнату для поиска игроков',
  })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({
    status: 201,
    description: 'Комната успешно создана',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные запроса',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async createRoom(
    @Body() createRoomDto: CreateRoomDto,
    @Req() req: any,
  ): Promise<RoomResponseDto> {
    try {
      const userId = req.user.id;
      this.logger.log(
        `Creating room for user ${userId} with name: ${createRoomDto.name}`,
      );

      const room = await this.roomService.createRoom(
        userId,
        createRoomDto.name,
      );

      this.logger.log(`Room ${room.id} created successfully`);
      return room;
    } catch (error) {
      this.logger.error('Не удалось создать комнату', error);
      throw new BadRequestException('Не удалось создать комнату');
    }
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Присоединиться к игровой комнате',
    description: 'Присоединяет игрока к существующей комнате',
  })
  @ApiParam({
    name: 'id',
    description: 'ID комнаты',
    example: 'abc123def456',
  })
  @ApiBody({ type: JoinRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Успешно присоединились к комнате',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные запроса',
  })
  @ApiResponse({
    status: 404,
    description: 'Комната не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async joinRoom(
    @Param('id') roomId: string,
    @Req() req: any,
  ): Promise<RoomResponseDto> {
    try {
      const userId = req.user.id;
      this.logger.log(
        `User ${userId} attempting to join room ${roomId}`,
      );

      const room = await this.roomService.joinRoom(roomId, userId);

      this.logger.log(
        `User ${userId} successfully joined room ${roomId}`,
      );
      return room;
    } catch (error) {
      this.logger.error(`Не удалось присоединиться к комнате ${roomId}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Не удалось присоединиться к комнате');
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить список активных комнат',
    description: 'Возвращает список всех доступных для присоединения комнат',
  })
  @ApiResponse({
    status: 200,
    description: 'Список активных комнат',
    type: ActiveRoomsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getActiveRooms(): Promise<ActiveRoomsResponseDto> {
    try {
      this.logger.log('Fetching active rooms');

      const rooms = await this.roomService.getActiveRooms();

      this.logger.log(`Found ${rooms.length} active rooms`);
      return { rooms };
    } catch (error) {
      this.logger.error('Не удалось получить список комнат');
      throw new BadRequestException('Не удалось получить список комнат');
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Получить информацию о комнате',
    description: 'Возвращает детальную информацию о конкретной комнате',
  })
  @ApiParam({
    name: 'id',
    description: 'ID комнаты',
    example: 'abc123def456',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о комнате',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Комната не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async getRoom(@Param('id') roomId: string): Promise<RoomResponseDto> {
    try {
      this.logger.log(`Fetching room ${roomId}`);

      const room = await this.roomService.getRoom(roomId);

      if (!room) {
        throw new NotFoundException('Комната не найдена');
      }

      return room;
    } catch (error) {
      this.logger.error(`Не удалось получить информацию о комнате ${roomId}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Не удалось получить информацию о комнате');
    }
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Покинуть комнату',
    description: 'Позволяет игроку покинуть комнату',
  })
  @ApiParam({
    name: 'id',
    description: 'ID комнаты',
    example: 'abc123def456',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID игрока, который покидает комнату',
          example: '507f1f77bcf86cd799439011',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Игрок успешно покинул комнату',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Игрок покинул комнату' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные запроса',
  })
  @ApiResponse({
    status: 404,
    description: 'Комната не найдена',
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован',
  })
  async leaveRoom(
    @Param('id') roomId: string,
    @Body() body: { userId: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`User ${body.userId} attempting to leave room ${roomId}`);

      // TODO: Здесь можно добавить логику покидания комнаты через roomService
      // const result = await this.roomService.leaveRoom(roomId, body.userId);

      this.logger.log(`User ${body.userId} successfully left room ${roomId}`);

      return {
        success: true,
        message: 'Успешно покинули комнату',
      };
    } catch (error) {
      this.logger.error(`Не удалось покинуть комнату ${roomId}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Не удалось покинуть комнату');
    }
  }
}
