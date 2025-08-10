import { ConfigModule } from '@nestjs/config';

export const TestConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env.test',
  load: [
    () => ({
      JWT_SECRET: 'GLADIUS',
      PORT: 7001,
      MONGO_URI:
        'mongodb://admin:password@localhost:27017/sea-battle-test?authSource=admin',
      NODE_ENV: 'test',
    }),
  ],
});
