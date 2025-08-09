import { Injectable, Logger } from '@nestjs/common';
import { IAuditService } from '../interfaces/notification.interface';
import { RedisService } from '../redis.service';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  gameId?: string;
  action: string;
  details?: any;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService implements IAuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly AUDIT_TTL = 30 * 24 * 60 * 60; // 30 days

  constructor(private readonly redisService: RedisService) {}

  async logUserAction(userId: string, action: string, details?: any): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId,
      action,
      details,
    };

    await this.saveAuditEntry(entry);
    this.logger.log(`User action logged: ${action} by user ${userId}`);
  }

  async logGameAction(gameId: string, playerId: string, action: string, details?: any): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      userId: playerId,
      gameId,
      action,
      details,
    };

    await this.saveAuditEntry(entry);
    this.logger.log(`Game action logged: ${action} by player ${playerId} in game ${gameId}`);
  }

  async getAuditLog(
    userId?: string, 
    gameId?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AuditLogEntry[]> {
    const auditKeys = await this.redisService.keys('audit:*');
    const entries: AuditLogEntry[] = [];

    for (const key of auditKeys) {
      const entry = await this.redisService.get<AuditLogEntry>(key);
      if (entry && this.matchesFilter(entry, userId, gameId, startDate, endDate)) {
        entries.push(entry);
      }
    }

    // Сортируем по времени (новые сначала)
    return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async saveAuditEntry(entry: AuditLogEntry): Promise<void> {
    const key = `audit:${entry.id}`;
    await this.redisService.set(key, entry, this.AUDIT_TTL);
  }

  private matchesFilter(
    entry: AuditLogEntry,
    userId?: string,
    gameId?: string,
    startDate?: Date,
    endDate?: Date
  ): boolean {
    if (userId && entry.userId !== userId) {
      return false;
    }

    if (gameId && entry.gameId !== gameId) {
      return false;
    }

    if (startDate && entry.timestamp < startDate) {
      return false;
    }

    if (endDate && entry.timestamp > endDate) {
      return false;
    }

    return true;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
