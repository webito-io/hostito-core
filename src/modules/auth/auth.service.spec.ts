import { UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

interface MockPrismaService {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  currency: {
    findFirst: jest.Mock;
  };
  setting: {
    findUnique: jest.Mock;
  };
  organization: {
    create: jest.Mock;
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: MockPrismaService;
  let jwtMock: { sign: jest.Mock };
  let eventEmitterMock: { emit: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      currency: {
        findFirst: jest.fn().mockResolvedValue({ id: 1, code: 'USD' }),
      },
      setting: {
        // default role
        findUnique: jest.fn().mockResolvedValue({ value: 2 }),
      },
      organization: {
        create: jest.fn().mockResolvedValue({ id: 1, name: 'Org Name' }),
      },
    };

    jwtMock = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    eventEmitterMock = {
      emit: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: EventEmitter2, useValue: eventEmitterMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return user and token when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: 1,
        organizationId: 1,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('test@example.com', 'password');

      expect(result.access_token).toBe('mock-token');
      expect(result.user.password).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login('x@x.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        password: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrongpass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        roleId: 1,
        organizationId: 1,
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.access_token).toBe('mock-token');
      expect(result.user.password).toBeUndefined();
    });
  });
});
