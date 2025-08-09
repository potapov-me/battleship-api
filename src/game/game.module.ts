import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { RedisModule } from '../shared/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [GameController, RoomController],
  providers: [GameService, RoomService],
})
export class GameModule {}
