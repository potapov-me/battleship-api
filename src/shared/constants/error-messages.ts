export const ERROR_MESSAGES = {
  VALIDATION: {
    INVALID_COORDINATES: 'Invalid coordinates provided',
    INVALID_GAME_ID: 'Invalid game ID',
    INVALID_PLAYER_ID: 'Invalid player ID',
    INVALID_SHIP_PLACEMENT: 'Invalid ship placement',
    SHIPS_OVERLAP: 'Ships cannot overlap',
    WRONG_SHIP_COUNT: 'Wrong number of ships',
    OUT_OF_BOUNDS: 'Ship placement is out of bounds',
  },
  GAME: {
    NOT_FOUND: 'Game not found',
    ALREADY_FINISHED: 'Game is already finished',
    NOT_ACTIVE: 'Game is not active',
    NOT_WAITING: 'Game is not in waiting state',
    NOT_YOUR_TURN: 'Not your turn',
    CELL_ALREADY_HIT: 'Cell already hit',
    PLAYER_NOT_IN_GAME: 'Player is not part of this game',
    CANNOT_START_WITHOUT_OPPONENT: 'Cannot start game without an opponent',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    EMAIL_NOT_CONFIRMED: 'Email not confirmed',
    USER_EXISTS: 'User already exists',
    INVALID_TOKEN: 'Invalid or expired token',
    UNAUTHORIZED: 'Unauthorized access',
  },
  RATE_LIMIT: {
    TOO_MANY_REQUESTS: 'Too many requests',
    LOGIN_ATTEMPTS_EXCEEDED: 'Too many login attempts',
  },
} as const;

export type ErrorMessages = typeof ERROR_MESSAGES;
