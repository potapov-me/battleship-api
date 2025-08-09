export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  create(entity: Partial<T>): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<T[]>;
}

export interface IGameRepository extends IRepository<any> {
  findByPlayerId(playerId: string): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  updateGameState(id: string, state: any): Promise<boolean>;
}

export interface IUserRepository extends IRepository<any> {
  findByEmail(email: string): Promise<any | null>;
  findByUsername(username: string): Promise<any | null>;
  confirmEmail(token: string): Promise<boolean>;
}
