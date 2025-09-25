import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UserRole } from '../common/enums/user-role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a user via the repository', async () => {
    repository.create.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      roles: [UserRole.Student],
    } as any);

    const result = await service.create({
      email: 'user@example.com',
      passwordHash: 'hash',
      roles: [UserRole.Student],
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
    );
    expect(result.email).toEqual('user@example.com');
  });

  it('delegates findByEmail to the repository', async () => {
    repository.findByEmail.mockResolvedValue(null);
    await service.findByEmail('missing@example.com');
    expect(repository.findByEmail).toHaveBeenCalledWith('missing@example.com');
  });

  it('delegates findById to the repository', async () => {
    repository.findById.mockResolvedValue(null);
    await service.findById('1');
    expect(repository.findById).toHaveBeenCalledWith('1');
  });
});
