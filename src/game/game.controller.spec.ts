import { Test, TestingModule } from '@nestjs/testing';
import { GameController } from './game.controller';
import { GameService } from './game.service';

describe('GameController', () => {
  let controller: GameController;
  let mockGameService: Partial<GameService>;

  beforeEach(async () => {
    mockGameService = {
      createGame: jest.fn(),
      placeShips: jest.fn(),
      makeShot: jest.fn(),
      getGame: jest.fn(),
      getGamesByPlayer: jest.fn(),
      getActiveGames: jest.fn(),
      surrender: jest.fn(),
    } as Partial<GameService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // GameController is currently empty, so we only test that it can be instantiated
  it('should be an instance of GameController', () => {
    expect(controller).toBeInstanceOf(GameController);
  });
});
