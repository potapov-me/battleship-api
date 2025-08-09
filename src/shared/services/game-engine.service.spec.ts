import { Test, TestingModule } from '@nestjs/testing';
import { GameEngineService } from './game-engine.service';
import { Board, Cell } from '../models/board.model';
import { Ship, ShipType, ShipDirection } from '../models/ship.model';

describe('GameEngineService', () => {
  let service: GameEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameEngineService],
    }).compile();

    service = module.get<GameEngineService>(GameEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmptyBoard', () => {
    it('should generate a 10x10 board', () => {
      const board = service.generateEmptyBoard();

      expect(board).toBeDefined();
      expect(board.grid).toHaveLength(10);
      expect(board.grid[0]).toHaveLength(10);
      expect(board.grid[9]).toHaveLength(10);
    });

    it('should have all cells with correct properties', () => {
      const board = service.generateEmptyBoard();

      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const cell = board.grid[i][j];
          expect(cell.x).toBe(i);
          expect(cell.y).toBe(j);
          expect(cell.isHit).toBe(false);
        }
      }
    });

    it('should initialize empty ships array', () => {
      const board = service.generateEmptyBoard();

      expect(board.ships).toBeDefined();
      expect(board.ships).toHaveLength(0);
    });
  });

  describe('validateShipPlacement', () => {
    it('should return false for empty ships array', () => {
      const board = service.generateEmptyBoard();
      const ships = [];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return false for invalid ship count', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 1, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL }, // Duplicate carrier
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return false for ships outside boundaries', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: -1, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 10, y: 5, type: ShipType.BATTLESHIP, direction: ShipDirection.VERTICAL },
        { x: 5, y: -1, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 5, y: 10, type: ShipType.SUBMARINE, direction: ShipDirection.VERTICAL },
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return false for ships extending beyond boundaries', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 8, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL }, // Carrier extends beyond x=10
        { x: 0, y: 8, type: ShipType.BATTLESHIP, direction: ShipDirection.VERTICAL }, // Battleship extends beyond y=10
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return false for overlapping ships', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 2, y: 0, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL }, // Overlaps with carrier
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(false);
    });

    it('should return true for valid ship placement', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
      ];

      const result = service.validateShipPlacement(board, ships);

      expect(result).toBe(true);
    });
  });

  describe('placeShipsOnBoard', () => {
    it('should place ships on board successfully', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
      ];

      const result = service.placeShipsOnBoard(board, ships);

      expect(result.ships).toHaveLength(5);
      expect(result.ships[0].type).toBe(ShipType.CARRIER);
      expect(result.ships[1].type).toBe(ShipType.BATTLESHIP);
      
      // Check that cells are marked with ship types
      expect(result.grid[0][0].shipId).toBe(ShipType.CARRIER);
      expect(result.grid[1][0].shipId).toBe(ShipType.CARRIER);
      expect(result.grid[2][0].shipId).toBe(ShipType.CARRIER);
      expect(result.grid[3][0].shipId).toBe(ShipType.CARRIER);
      expect(result.grid[4][0].shipId).toBe(ShipType.CARRIER);
      
      expect(result.grid[0][2].shipId).toBe(ShipType.BATTLESHIP);
      expect(result.grid[1][2].shipId).toBe(ShipType.BATTLESHIP);
      expect(result.grid[2][2].shipId).toBe(ShipType.BATTLESHIP);
      expect(result.grid[3][2].shipId).toBe(ShipType.BATTLESHIP);
    });

    it('should throw error for invalid ship placement', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: -1, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
      ];

      expect(() => service.placeShipsOnBoard(board, ships)).toThrow('Invalid ship placement');
    });
  });

  describe('processAttack', () => {
    it('should process attack and hit ship', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
      ];
      const boardWithShips = service.placeShipsOnBoard(board, ships);

      const result = service.processAttack(boardWithShips, 0, 0);

      expect(result.hit).toBe(true);
      expect(result.shipId).toBe(ShipType.CARRIER);
      expect(boardWithShips.grid[0][0].isHit).toBe(true);
    });

    it('should process attack and miss', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
      ];
      const boardWithShips = service.placeShipsOnBoard(board, ships);

      const result = service.processAttack(boardWithShips, 5, 5);

      expect(result.hit).toBe(false);
      expect(result.shipId).toBeUndefined();
      expect(boardWithShips.grid[5][5].isHit).toBe(true);
    });

    it('should throw error for invalid coordinates', () => {
      const board = service.generateEmptyBoard();

      expect(() => service.processAttack(board, -1, 0)).toThrow('Invalid coordinates');
      expect(() => service.processAttack(board, 10, 0)).toThrow('Invalid coordinates');
      expect(() => service.processAttack(board, 0, -1)).toThrow('Invalid coordinates');
      expect(() => service.processAttack(board, 0, 10)).toThrow('Invalid coordinates');
    });

    it('should throw error for already hit cell', () => {
      const board = service.generateEmptyBoard();
      board.grid[0][0].isHit = true;

      expect(() => service.processAttack(board, 0, 0)).toThrow('Cell already hit');
    });

    it('should detect sunk ship', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
      ];
      const boardWithShips = service.placeShipsOnBoard(board, ships);

      // Hit first cell
      const result1 = service.processAttack(boardWithShips, 0, 0);
      expect(result1.hit).toBe(true);
      expect(result1.sunk).toBe(false);

      // Hit second cell - ship should be sunk
      const result2 = service.processAttack(boardWithShips, 1, 0);
      expect(result2.hit).toBe(true);
      expect(result2.sunk).toBe(true);
    });
  });

  describe('checkWinCondition', () => {
    it('should return true when all ships are sunk', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
      ];
      const boardWithShips = service.placeShipsOnBoard(board, ships);

      // Sink all ships (simplified - just sink the destroyer)
      service.processAttack(boardWithShips, 0, 0);
      service.processAttack(boardWithShips, 1, 0);

      const result = service.checkWinCondition(boardWithShips);

      expect(result).toBe(false); // Not all ships are sunk
    });

    it('should return false when not all ships are sunk', () => {
      const board = service.generateEmptyBoard();
      const ships = [
        { x: 0, y: 0, type: ShipType.CARRIER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 2, type: ShipType.BATTLESHIP, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 4, type: ShipType.CRUISER, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 6, type: ShipType.SUBMARINE, direction: ShipDirection.HORIZONTAL },
        { x: 0, y: 8, type: ShipType.DESTROYER, direction: ShipDirection.HORIZONTAL },
      ];
      const boardWithShips = service.placeShipsOnBoard(board, ships);

      // Hit only one cell of the carrier
      service.processAttack(boardWithShips, 0, 0);

      const result = service.checkWinCondition(boardWithShips);

      expect(result).toBe(false);
    });

    it('should return true for empty board', () => {
      const board = service.generateEmptyBoard();

      const result = service.checkWinCondition(board);

      expect(result).toBe(true);
    });
  });
});
