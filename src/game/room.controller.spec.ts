import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { CreateRoomDto, JoinRoomDto } from './dto/room.dto';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: RoomService;

  const mockRoomService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    getActiveRooms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    roomService = module.get<RoomService>(RoomService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const createRoomDto: CreateRoomDto = {
        userId: 'user_123',
        name: 'Test Room',
      };

      const mockRoom = {
        id: 'room_123',
        name: 'Test Room',
        creatorId: 'user_123',
        players: ['user_123'],
        status: 'waiting',
      };

      mockRoomService.createRoom.mockResolvedValue(mockRoom);

      const result = await controller.createRoom(createRoomDto);

      expect(result).toEqual(mockRoom);
      expect(mockRoomService.createRoom).toHaveBeenCalledWith(
        createRoomDto.userId,
        createRoomDto.name,
      );
    });

    it('should handle service errors', async () => {
      const createRoomDto: CreateRoomDto = {
        userId: 'user_123',
        name: 'Test Room',
      };

      const error = new Error('Failed to create room');
      mockRoomService.createRoom.mockRejectedValue(error);

      await expect(controller.createRoom(createRoomDto)).rejects.toThrow(
        'Не удалось создать комнату',
      );
    });
  });

  describe('joinRoom', () => {
    it('should join a room successfully', async () => {
      const roomId = 'room_123';
      const joinRoomDto: JoinRoomDto = {
        userId: 'user_456',
      };

      const mockRoom = {
        id: roomId,
        name: 'Test Room',
        players: ['user_123', 'user_456'],
        status: 'waiting',
      };

      mockRoomService.joinRoom.mockResolvedValue(mockRoom);

      const result = await controller.joinRoom(roomId, joinRoomDto);

      expect(result).toEqual(mockRoom);
      expect(mockRoomService.joinRoom).toHaveBeenCalledWith(
        roomId,
        joinRoomDto.userId,
      );
    });

    it('should handle service errors', async () => {
      const roomId = 'room_123';
      const joinRoomDto: JoinRoomDto = {
        userId: 'user_456',
      };

      const error = new Error('Room not found');
      mockRoomService.joinRoom.mockRejectedValue(error);

      await expect(controller.joinRoom(roomId, joinRoomDto)).rejects.toThrow(
        'Не удалось присоединиться к комнате',
      );
    });
  });

  describe('getActiveRooms', () => {
    it('should get active rooms successfully', async () => {
      const mockRooms = [
        { id: 'room_1', name: 'Room 1', status: 'waiting' },
        { id: 'room_2', name: 'Room 2', status: 'playing' },
      ];

      mockRoomService.getActiveRooms.mockResolvedValue(mockRooms);

      const result = await controller.getActiveRooms();

      expect(result).toEqual({ rooms: mockRooms });
      expect(mockRoomService.getActiveRooms).toHaveBeenCalled();
    });

    it('should return empty array when no rooms exist', async () => {
      mockRoomService.getActiveRooms.mockResolvedValue([]);

      const result = await controller.getActiveRooms();

      expect(result).toEqual({ rooms: [] });
      expect(mockRoomService.getActiveRooms).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const error = new Error('Failed to get rooms');
      mockRoomService.getActiveRooms.mockRejectedValue(error);

      await expect(controller.getActiveRooms()).rejects.toThrow(
        'Не удалось получить список комнат',
      );
    });
  });
});
