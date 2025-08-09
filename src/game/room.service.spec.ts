import { Test, TestingModule } from '@nestjs/testing';
import { RoomService, RoomEntity } from './room.service';
import { RoomStatus } from './models/room.models';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService],
    }).compile();

    service = module.get<RoomService>(RoomService);
    service.clearAll();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a room', () => {
    const room = service.createRoom('u1', 'Test Room');
    expect(room).toMatchObject<Partial<RoomEntity>>({
      creatorId: 'u1',
      name: 'Test Room',
      status: RoomStatus.Waiting,
    });
    expect(room.id).toBeTruthy();
  });

  it('lists active rooms (waiting)', () => {
    const r1 = service.createRoom('u1');
    const r2 = service.createRoom('u2');
    service.joinRoom(r2.id, 'u3');
    service.startGame(r2.id);
    const active = service.getActiveRooms();
    expect(active.map((r) => r.id)).toEqual([r1.id]);
  });

  it('prevents joining non-waiting rooms and duplicate joins', () => {
    const r = service.createRoom('u1');
    const afterJoin = service.joinRoom(r.id, 'u2');
    expect(afterJoin.opponentId).toBe('u2');
    expect(() => service.joinRoom(r.id, 'u3')).toThrow();
    service.startGame(r.id);
    expect(() => service.joinRoom(r.id, 'u4')).toThrow();
  });

  it('prevents creator joining as opponent', () => {
    const r = service.createRoom('u1');
    expect(() => service.joinRoom(r.id, 'u1')).toThrow();
  });

  it('starts game only with opponent', () => {
    const r = service.createRoom('u1');
    expect(() => service.startGame(r.id)).toThrow();
    service.joinRoom(r.id, 'u2');
    const started = service.startGame(r.id);
    expect(started.status).toBe(RoomStatus.Active);
    expect(started.startedAt).toBeInstanceOf(Date);
  });

  it('finishes game', () => {
    const r = service.createRoom('u1');
    service.joinRoom(r.id, 'u2');
    service.startGame(r.id);
    const finished = service.finishGame(r.id);
    expect(finished.status).toBe(RoomStatus.Finished);
    expect(finished.finishedAt).toBeInstanceOf(Date);
  });
});


