import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [MailService, RedisService],
  exports: [MailService, RedisService],
})
export class SharedModule {}


