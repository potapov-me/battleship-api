import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto, JoinRoomDto, RoomResponseDto, ActiveRoomsResponseDto } from './dto/room.dto';

@ApiTags('rooms')
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @ApiOperation({ summary: 'Создать новую игровую комнату' })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Комната успешно создана',
    type: RoomResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    // В реальном приложении userId лучше получать из объекта запроса (например, после аутентификации)
    return this.roomService.createRoom(createRoomDto.userId, createRoomDto.name);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Присоединиться к игровой комнате' })
  @ApiParam({ name: 'id', description: 'ID комнаты', example: 'abc123def456' })
  @ApiBody({ type: JoinRoomDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Успешно присоединились к комнате',
    type: RoomResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Неверные данные запроса' })
  @ApiResponse({ status: 404, description: 'Комната не найдена' })
  async joinRoom(@Param('id') roomId: string, @Body() joinRoomDto: JoinRoomDto) {
    return this.roomService.joinRoom(roomId, joinRoomDto.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список активных комнат' })
  @ApiResponse({ 
    status: 200, 
    description: 'Список активных комнат',
    type: ActiveRoomsResponseDto 
  })
  async getActiveRooms() {
    return { rooms: await this.roomService.getActiveRooms() };
  }
}
