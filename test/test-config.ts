import { ConfigModule } from '@nestjs/config';

export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
  load: [
    () => ({
      JWT_SECRET: 'GLADIUS',
      PORT: 7001,
      MONGO_URI: 'mongodb://localhost:27017/sea-battle-test',
      NODE_ENV: 'test',
    }),
  ],
});
