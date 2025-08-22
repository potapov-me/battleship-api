import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { GameStatsController } from './game-stats.controller';
import { SharedModule } from '../shared/shared.module';
import { RedisModule } from '../shared/redis.module';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [SharedModule, RedisModule, UsersModule],
  controllers: [GameController, RoomController, GameStatsController],
  providers: [GameService, RoomService],
  exports: [GameService, RoomService],
})
export class GameModule {}
