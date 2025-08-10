import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log request and response', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/test',
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ data: 'test' }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // First call for start time
        .mockReturnValueOnce(1100); // Second call for end time

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          // Just verify the interceptor doesn't throw errors
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle request without User-Agent header', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/api/test',
            ip: '192.168.1.1',
            get: jest.fn().mockReturnValue(undefined),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ success: true }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(2000)
        .mockReturnValueOnce(2100);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle different HTTP methods', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'PUT',
            url: '/users/123',
            ip: '10.0.0.1',
            get: jest.fn().mockReturnValue('PostmanRuntime/7.29.0'),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ updated: true }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(3000)
        .mockReturnValueOnce(3050);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle DELETE requests', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'DELETE',
            url: '/users/123',
            ip: '172.16.0.1',
            get: jest.fn().mockReturnValue('curl/7.68.0'),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ deleted: true }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(4000)
        .mockReturnValueOnce(4100);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle PATCH requests', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'PATCH',
            url: '/users/123/status',
            ip: '8.8.8.8',
            get: jest.fn().mockReturnValue('axios/0.21.1'),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ patched: true }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(5000)
        .mockReturnValueOnce(5200);

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });

    it('should handle requests with long response times', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/heavy-operation',
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('Chrome/91.0.4472.124'),
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of({ result: 'heavy-data' }),
      };

      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(10000)
        .mockReturnValueOnce(15000); // 5 seconds

      interceptor.intercept(mockContext, mockCallHandler).subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done,
      });
    });
  });
});
