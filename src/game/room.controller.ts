import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(@Body('userId') userId: string, @Body('name') name?: string) {
    // В реальном приложении userId лучше получать из объекта запроса (например, после аутентификации)
    return this.roomService.createRoom(userId, name);
  }

  @Post(':id/join')
  async joinRoom(@Param('id') roomId: string, @Body('userId') userId: string) {
    return this.roomService.joinRoom(roomId, userId);
  }

  @Get()
  async getActiveRooms() {
    return { rooms: await this.roomService.getActiveRooms() };
  }
}
