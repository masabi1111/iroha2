import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../common/enums/user-role.enum';
import * as argon2 from 'argon2';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

const configValues = {
  ACCESS_TOKEN_SECRET: 'test-access-secret',
  REFRESH_TOKEN_SECRET: 'test-refresh-secret',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: keyof typeof configValues) => configValues[key],
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('registers a new user and returns tokens', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockImplementation(async (input) => ({
      id: '1',
      email: input.email,
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      passwordHash: input.passwordHash ?? undefined,
      roles: input.roles,
    }));

    const tokens = await service.register({
      email: 'new@example.com',
      password: 'strongPassword1',
      firstName: 'Jane',
      lastName: 'Doe',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        roles: [UserRole.Student],
      }),
    );
    const [[createArgs]] = usersService.create.mock.calls;
    expect(createArgs.passwordHash).toBeDefined();
    expect(createArgs.passwordHash).not.toEqual('strongPassword1');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('throws when email already exists during registration', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: '1',
      email: 'exists@example.com',
      roles: [UserRole.Student],
    } as any);

    await expect(
      service.register({
        email: 'exists@example.com',
        password: 'Password1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in a user with valid credentials', async () => {
    const hashed = await argon2.hash('Password1', { type: argon2.argon2id });
    usersService.findByEmail.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      passwordHash: hashed,
      roles: [UserRole.Student],
    } as any);

    const tokens = await service.login({ email: 'user@example.com', password: 'Password1' });
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('throws when credentials are invalid', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'Password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refreshes tokens with a valid refresh token', async () => {
    const user = {
      id: '1',
      email: 'user@example.com',
      roles: [UserRole.Student],
    };
    usersService.findById.mockResolvedValue(user as any);

    const jwtService = new JwtService();
    const refreshToken = await jwtService.signAsync(
      { ...user, tokenType: 'refresh' as const },
      { secret: configValues.REFRESH_TOKEN_SECRET, expiresIn: '7d' },
    );

    const tokens = await service.refresh({ refreshToken });
    expect(usersService.findById).toHaveBeenCalled();
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('throws when refresh token is invalid', async () => {
    await expect(service.refresh({ refreshToken: 'invalid' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
