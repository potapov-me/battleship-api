export interface INotificationService {
  sendEmail(to: string, subject: string, content: string): Promise<void>;
  sendEmailConfirmation(to: string, token: string): Promise<void>;
  sendGameInvitation(to: string, gameId: string, inviterName: string): Promise<void>;
  sendGameUpdate(to: string, gameId: string, update: string): Promise<void>;
}

export interface IAuditService {
  logUserAction(userId: string, action: string, details?: any): Promise<void>;
  logGameAction(gameId: string, playerId: string, action: string, details?: any): Promise<void>;
  getAuditLog(userId?: string, gameId?: string, startDate?: Date, endDate?: Date): Promise<any[]>;
}
