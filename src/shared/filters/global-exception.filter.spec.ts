import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

function createMockHost(path = '/test', method = 'GET') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const getResponse = () => ({ status });
  const getRequest = () => ({ url: path, method });
  const switchToHttp = () => ({ getResponse, getRequest });
  return {
    switchToHttp,
  } as unknown as ArgumentsHost & { __mocks: { status: jest.Mock; json: jest.Mock } };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    // Silence logger
    (filter as any).logger = { error: jest.fn() };
  });

  it('should format HttpException response', () => {
    const host = createMockHost();
    const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

    filter.catch(exception, host);
    const http = host.switchToHttp();
    const res = http.getResponse() as any;

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.status().json).toHaveBeenCalled();
    const payload = res.status().json.mock.calls[0][0];
    expect(payload.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(payload.path).toBe('/test');
    expect(typeof payload.timestamp).toBe('string');
    expect(payload.message).toBe('Bad Request');
  });

  it('should handle generic Error', () => {
    const host = createMockHost('/err', 'POST');
    const exception = new Error('Something broke');

    filter.catch(exception, host);
    const res = (host.switchToHttp() as any).getResponse();

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const payload = res.status().json.mock.calls[0][0];
    expect(payload.message).toBe('Something broke');
    expect(payload.error).toBe('Error');
  });
});
