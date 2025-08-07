import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  createRoom(@Body('userId') userId: string) {
    // В реальном приложении userId лучше получать из объекта запроса (например, после аутентификации)
    return this.roomService.createRoom(userId);
  }

  @Post(':id/join')
  joinRoom(@Param('id') roomId: string, @Body('userId') userId: string) {
    return this.roomService.joinRoom(roomId, userId);
  }

  @Get()
  getActiveRooms() {
    // TODO: Реализовать метод в RoomService для получения списка комнат
    console.log('Fetching active rooms');
    return { rooms: [] }; // Возвращаем пустой массив как заглушку
  }
}
