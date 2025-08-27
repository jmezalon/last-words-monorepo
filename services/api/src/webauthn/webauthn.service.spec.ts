import { Test, TestingModule } from '@nestjs/testing';
import { WebAuthnService } from './webauthn.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
  },
  authenticator: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAuthnService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebAuthnService>(WebAuthnService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRegistrationOptions', () => {
    it('should generate registration options for a user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        authenticators: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const options = await service.generateRegistrationOptions('user-id');

      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('rp');
      expect(options).toHaveProperty('user');
      expect(options.user.id).toBe('user-id');
      expect(options.user.name).toBe('test@example.com');
      expect(options.user.displayName).toBe('Test User');
    });

    it('should throw error if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.generateRegistrationOptions('user-id')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('should generate authentication options', async () => {
      const options = await service.generateAuthenticationOptions();

      expect(options).toHaveProperty('challenge');
      expect(options).toHaveProperty('timeout');
      expect(options).toHaveProperty('userVerification');
    });

    it('should include user authenticators when userId provided', async () => {
      const mockUser = {
        id: 'user-id',
        authenticators: [
          {
            credentialID: 'Y3JlZGVudGlhbC1pZA',
            transports: 'usb,nfc',
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const options = await service.generateAuthenticationOptions('user-id');

      expect(options).toHaveProperty('allowCredentials');
      expect(options.allowCredentials).toHaveLength(1);
    });
  });

  describe('verifyAuthentication', () => {
    it('should throw error if authenticator not found', async () => {
      const mockResponse = { id: 'Y3JlZGVudGlhbC1pZA' };
      
      mockPrismaService.authenticator.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyAuthentication(mockResponse, 'challenge', 'user-id')
      ).rejects.toThrow('Authenticator not found');
    });

    it('should throw error if authenticator does not belong to user', async () => {
      const mockResponse = { id: 'Y3JlZGVudGlhbC1pZA' };
      const mockAuthenticator = {
        userId: 'different-user-id',
        user: { id: 'different-user-id' },
      };

      mockPrismaService.authenticator.findUnique.mockResolvedValue(mockAuthenticator);

      await expect(
        service.verifyAuthentication(mockResponse, 'challenge', 'user-id')
      ).rejects.toThrow('Authenticator does not belong to user');
    });
  });
});
