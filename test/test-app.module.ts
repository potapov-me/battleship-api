import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { GameModule } from '../src/game/game.module';
import { PlayersModule } from '../src/players/players.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          JWT_SECRET: 'GLADIUS',
          PORT: 7002,
          MONGO_URI: 'mongodb://localhost:27017/battleship-test',
          NODE_ENV: 'test',
        }),
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        connectionFactory: (connection: Connection) => {
          connection.on('connected', () => {
            console.log('Test MongoDB connected successfully!');
          });
          connection.on('error', (err) => {
            console.error('Test MongoDB connection error:', err);
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    GameModule,
    PlayersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule {}
