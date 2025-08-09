import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should store mail data successfully', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      };

      // Mock config values
      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'NODE_ENV': 'test',
          'DOMAIN': 'http://localhost:3000',
        };
        return config[key];
      });

      await service.sendMail(mailData);

      const lastMail = service.getLastMail();
      expect(lastMail).toEqual(mailData);
    });

    it('should handle mail with confirmation link', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: '',
        text: '',
        html: '',
        confirmationLink: '/confirm?token=123',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'NODE_ENV': 'test',
          'DOMAIN': 'http://localhost:3000',
        };
        return config[key];
      });

      await service.sendMail(mailData);

      const lastMail = service.getLastMail();
      expect(lastMail).toBeDefined();
      expect(lastMail?.confirmationLink).toBe('http://localhost:3000/confirm?token=123');
      expect(lastMail?.subject).toBe('Подтверждение email');
      expect(lastMail?.text).toContain('http://localhost:3000/confirm?token=123');
      expect(lastMail?.html).toContain('http://localhost:3000/confirm?token=123');
    });

    it('should handle absolute confirmation link', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
        confirmationLink: 'https://example.com/confirm?token=123',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'NODE_ENV': 'test',
          'DOMAIN': 'http://localhost:3000',
        };
        return config[key];
      });

      await service.sendMail(mailData);

      const lastMail = service.getLastMail();
      expect(lastMail).toBeDefined();
      expect(lastMail?.confirmationLink).toBe('https://example.com/confirm?token=123');
    });

    it('should handle domain with trailing slash', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
        confirmationLink: 'confirm?token=123',
      };

      mockConfigService.get.mockImplementation((key: string) => {
        const config = {
          'NODE_ENV': 'test',
          'DOMAIN': 'http://localhost:3000/',
        };
        return config[key];
      });

      await service.sendMail(mailData);

      const lastMail = service.getLastMail();
      expect(lastMail).toBeDefined();
      expect(lastMail?.confirmationLink).toBe('http://localhost:3000/confirm?token=123');
    });
  });

  describe('getLastMail', () => {
    it('should return null when no mail has been sent', () => {
      const lastMail = service.getLastMail();
      expect(lastMail).toBeNull();
    });

    it('should return the last sent mail', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      };

      mockConfigService.get.mockReturnValue('test');

      await service.sendMail(mailData);

      const lastMail = service.getLastMail();
      expect(lastMail).toEqual(mailData);
    });
  });

  describe('clear', () => {
    it('should clear the last mail', async () => {
      const mailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>',
      };

      mockConfigService.get.mockReturnValue('test');

      await service.sendMail(mailData);
      expect(service.getLastMail()).toEqual(mailData);

      service.clear();
      expect(service.getLastMail()).toBeNull();
    });
  });
});
