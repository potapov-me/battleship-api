export interface AttackResult {
  hit: boolean;
  sunk: boolean;
  shipId?: string;
}

export interface GameResult {
  success: boolean;
}

export interface ShotResult {
  hit: boolean;
  sunk: boolean;
  gameOver: boolean;
}

export interface GameCreationResult {
  gameId: string;
  game: any;
}

export interface ShipPlacementResult {
  success: boolean;
}
