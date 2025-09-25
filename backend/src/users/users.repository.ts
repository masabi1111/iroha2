import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums/user-role.enum';
import { Prisma, roles } from '@prisma/client';
import { UserEntity } from './entities/user.entity';

export interface CreateUserInput {
  email: string;
  passwordHash: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roles: UserRole[];
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<UserEntity> {
    const rolesToAssign: roles[] = await this.prisma.roles.findMany({
      where: { name: { in: input.roles } },
    });

    if (rolesToAssign.length !== input.roles.length) {
      const existingRoleNames = new Set(rolesToAssign.map((role: roles) => role.name));
      const missing = input.roles.filter((role) => !existingRoleNames.has(role));
      throw new Error(`Roles not found: ${missing.join(', ')}`);
    }

    const createdUser = await this.prisma.users.create({
      data: {
        email: input.email,
        password_hash: input.passwordHash,
        first_name: input.firstName ?? null,
        last_name: input.lastName ?? null,
        user_roles: {
          create: rolesToAssign.map((role: roles) => ({
            role: { connect: { id: role.id } },
          })),
        },
      },
      include: {
        user_roles: { include: { role: true } },
      },
    });

    return this.mapToEntity(createdUser);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: { include: { role: true } },
      },
    });

    return user ? this.mapToEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const numericId = BigInt(id);
    const user = await this.prisma.users.findUnique({
      where: { id: numericId },
      include: {
        user_roles: { include: { role: true } },
      },
    });

    return user ? this.mapToEntity(user) : null;
  }

  private mapToEntity(user: UserWithRoles): UserEntity {
    return {
      id: user.id.toString(),
      email: user.email,
      firstName: user.first_name ?? undefined,
      lastName: user.last_name ?? undefined,
      passwordHash: user.password_hash ?? undefined,
      roles: user.user_roles.map(
        (userRole: UserWithRoles['user_roles'][number]) => userRole.role.name as UserRole,
      ),
    };
  }
}

type UserWithRoles = Prisma.usersGetPayload<{
  include: { user_roles: { include: { role: true } } };
}>;
