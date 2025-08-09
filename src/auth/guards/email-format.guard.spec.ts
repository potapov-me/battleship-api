import { Test, TestingModule } from '@nestjs/testing';
import { EmailFormatGuard } from './email-format.guard';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { MESSAGES } from 'src/shared/constants/messages';

describe('EmailFormatGuard', () => {
  let guard: EmailFormatGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailFormatGuard],
    }).compile();

    guard = module.get<EmailFormatGuard>(EmailFormatGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid email format', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for valid email with subdomain', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@sub.example.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for valid email with multiple subdomains', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@sub1.sub2.example.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for valid email with numbers', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test123@example123.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for valid email with hyphens', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test-user@example-domain.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true for valid email with underscores', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test_user@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw BadRequestException for invalid email without @', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'testexample.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email without domain', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email without local part', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: '@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email with consecutive dots', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test..user@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email starting with dot', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: '.test@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email ending with dot', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test.@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email with consecutive dots in domain', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example..com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email starting with dot in domain', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@.example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email ending with dot in domain', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example.',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email without TLD', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for invalid email with invalid characters', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test@example!.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for empty email', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: '',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for email with only spaces', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: '   ',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });

    it('should throw BadRequestException for email with spaces', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            body: {
              email: 'test user@example.com',
            },
          }),
        }),
      } as ExecutionContext;

      expect(() => guard.canActivate(mockContext)).toThrow(
        new BadRequestException(MESSAGES.errors.invalidEmail),
      );
    });
  });
});
