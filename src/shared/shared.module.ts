import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';
import { GameEngineService } from './services/game-engine.service';
import { GameStateManagerService } from './services/game-state-manager.service';
import { AuditService } from './services/audit.service';
import { NotificationService } from './services/notification.service';
import { GameValidatorService } from './validators/game-validator.service';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import type {
  IGameEngine,
  IGameStateManager,
} from './interfaces/game-engine.interface';
import type {
  INotificationService,
  IAuditService,
} from './interfaces/notification.interface';

@Global()
@Module({
  imports: [RedisModule],
  providers: [
    RedisService,
    MailService,
    { provide: 'IGameEngine', useClass: GameEngineService },
    { provide: 'IGameStateManager', useClass: GameStateManagerService },
    { provide: 'IAuditService', useClass: AuditService },
    { provide: 'INotificationService', useClass: NotificationService },
    GameValidatorService,
  ],
  exports: [
    RedisService,
    MailService,
    'IGameEngine',
    'IGameStateManager',
    'IAuditService',
    'INotificationService',
    GameValidatorService,
    RedisModule,
  ],
})
export class SharedModule {}
