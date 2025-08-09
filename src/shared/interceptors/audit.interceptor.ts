import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import type { IAuditService } from '../interfaces/notification.interface';
import { AUDIT_ACTION_KEY, AUDIT_DETAILS_KEY } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @Inject('IAuditService') private auditService: IAuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const action = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    const detailsFn = this.reflector.get<Function>(AUDIT_DETAILS_KEY, context.getHandler());

    if (!action) {
      return next.handle();
    }

    const user = request.user;
    const args = [request.body, request.params, request.query];

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const details = detailsFn ? detailsFn(args) : { result };
          
          if (user?.id) {
            await this.auditService.logUserAction(user.id, action, details);
          }
          
          if (request.params?.gameId) {
            await this.auditService.logGameAction(
              request.params.gameId,
              user?.id || 'anonymous',
              action,
              details
            );
          }
        } catch (error) {
          // Логируем ошибку аудита, но не прерываем выполнение
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }
}
