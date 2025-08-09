import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { MESSAGES } from 'src/shared/constants/messages';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockContext = {} as ExecutionContext;

      const result = guard.handleRequest(null, mockUser, null, mockContext);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when no token is provided', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'No auth token' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no authorization token is found', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'No authorization token was found' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT must be provided', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'JWT must be provided' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with custom message for other errors', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'Token expired' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(new UnauthorizedException(MESSAGES.errors.unauthorized));
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const mockContext = {} as ExecutionContext;
      const mockError = new Error('Authentication failed');

      expect(() => {
        guard.handleRequest(mockError, null, null, mockContext);
      }).toThrow(new UnauthorizedException(MESSAGES.errors.unauthorized));
    });

    it('should throw UnauthorizedException when no user and no error/info', () => {
      const mockContext = {} as ExecutionContext;

      expect(() => {
        guard.handleRequest(null, null, null, mockContext);
      }).toThrow(new UnauthorizedException(MESSAGES.errors.unauthorized));
    });

    it('should handle case-insensitive token error messages', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'NO AUTH TOKEN' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should handle mixed case token error messages', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = { message: 'No Authorization Token Was Found' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should handle info as string', () => {
      const mockContext = {} as ExecutionContext;
      const mockInfo = 'No auth token';

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);
    });

    it('should handle error with message property', () => {
      const mockContext = {} as ExecutionContext;
      const mockError = { message: 'No auth token' };

      expect(() => {
        guard.handleRequest(mockError, null, null, mockContext);
      }).toThrow(UnauthorizedException);
    });
  });
});
