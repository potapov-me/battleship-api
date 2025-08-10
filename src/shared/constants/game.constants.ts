export const GAME_CONSTANTS = {
  BOARD_SIZE: 10,
  SHIP_SIZES: {
    CARRIER: 5,
    BATTLESHIP: 4,
    CRUISER: 3,
    SUBMARINE: 3,
    DESTROYER: 2,
  },
  REQUIRED_SHIPS: {
    CARRIER: 1,
    BATTLESHIP: 1,
    CRUISER: 1,
    SUBMARINE: 1,
    DESTROYER: 1,
  },
  GAME_TTL: 24 * 60 * 60, // 24 hours in seconds
} as const;

export type GameConstants = typeof GAME_CONSTANTS;
