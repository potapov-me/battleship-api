import { Test, TestingModule } from '@nestjs/testing';
import { RoomService, RoomEntity } from './room.service';
import { RoomStatus } from './models/room.models';
import { RedisService } from '../shared/redis.service';

describe('RoomService', () => {
  let service: RoomService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    redisService = module.get<RedisService>(RedisService);
    await service.clearAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a room', async () => {
    const mockRoom: RoomEntity = {
      id: 'test-id',
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };

    jest.spyOn(redisService, 'set').mockResolvedValue();

    const room = await service.createRoom('u1', 'Test Room');
    expect(room).toMatchObject<Partial<RoomEntity>>({
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
    });
    expect(room.id).toBeTruthy();
  });

  it('lists active rooms (waiting)', async () => {
    const mockRoom1: RoomEntity = {
      id: 'room1',
      creatorId: 'u1',
      name: 'Room 1',
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };

    const mockRoom2: RoomEntity = {
      id: 'room2',
      creatorId: 'u2',
      name: 'Room 2',
      status: RoomStatus.Active,
      createdAt: new Date(),
      startedAt: new Date(),
    };

    jest
      .spyOn(redisService, 'keys')
      .mockResolvedValue(['room:room1', 'room:room2']);
    jest
      .spyOn(redisService, 'get')
      .mockResolvedValueOnce(mockRoom1)
      .mockResolvedValueOnce(mockRoom2);

    const active = await service.getActiveRooms();
    expect(active.map((r) => r.id)).toEqual(['room1']);
  });

  it('prevents joining non-waiting rooms and duplicate joins', async () => {
    const mockRoom: RoomEntity = {
      id: 'test-room',
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };

    jest.spyOn(redisService, 'get').mockResolvedValue(mockRoom);
    jest.spyOn(redisService, 'set').mockResolvedValue();

    const afterJoin = await service.joinRoom('test-room', 'u2');
    expect(afterJoin.opponentId).toBe('u2');

    await expect(service.joinRoom('test-room', 'u3')).rejects.toThrow();

    mockRoom.status = RoomStatus.Active;
    await expect(service.joinRoom('test-room', 'u4')).rejects.toThrow();
  });

  it('prevents creator joining as opponent', async () => {
    const mockRoom: RoomEntity = {
      id: 'test-room',
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };

    jest.spyOn(redisService, 'get').mockResolvedValue(mockRoom);

    await expect(service.joinRoom('test-room', 'u1')).rejects.toThrow();
  });

  it('starts game only with opponent', async () => {
    const mockRoom: RoomEntity = {
      id: 'test-room',
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
      createdAt: new Date(),
    };

    jest.spyOn(redisService, 'get').mockResolvedValue(mockRoom);
    jest.spyOn(redisService, 'set').mockResolvedValue();

    await expect(service.startGame('test-room')).rejects.toThrow();

    mockRoom.opponentId = 'u2';
    const started = await service.startGame('test-room');
    expect(started.status).toBe(RoomStatus.Active);
    expect(started.startedAt).toBeInstanceOf(Date);
  });

  it('finishes game', async () => {
    const mockRoom: RoomEntity = {
      id: 'test-room',
      creatorId: 'u1',
      opponentId: 'u2',
      name: 'Test Room',
      status: RoomStatus.Active,
      createdAt: new Date(),
      startedAt: new Date(),
    };

    jest.spyOn(redisService, 'get').mockResolvedValue(mockRoom);
    jest.spyOn(redisService, 'set').mockResolvedValue();

    const finished = await service.finishGame('test-room');
    expect(finished.status).toBe(RoomStatus.Finished);
    expect(finished.finishedAt).toBeInstanceOf(Date);
  });
});
