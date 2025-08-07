import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomService {
  createRoom(userId: string) {
    // TODO: Implement room creation logic
    console.log(`User ${userId} created a room.`);
    return { roomId: 'new-room-id' };
  }

  joinRoom(roomId: string, userId: string) {
    // TODO: Implement room joining logic
    console.log(`User ${userId} joined room ${roomId}.`);
    return { success: true };
  }

  startGame(roomId: string) {
    // TODO: Implement start game logic
    console.log(`Game starting in room ${roomId}.`);
    return { success: true };
  }
}
