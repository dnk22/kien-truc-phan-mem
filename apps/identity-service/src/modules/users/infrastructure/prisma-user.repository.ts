import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type {
  CreateUser,
  UpdateUser,
  UserQuery,
  UserRepository,
} from '../domain/user.repository';
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaService) {}
  findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } });
  }
  findById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
  async list(query: UserQuery) {
    const where: Prisma.UserWhereInput = {
      role: query.role,
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { username: { contains: query.search, mode: 'insensitive' } },
              { fullName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.db.$transaction(
      [
        this.db.user.findMany({
          where,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        }),
        this.db.user.count({ where }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return { items, total };
  }
  private async authorized(tx: Prisma.TransactionClient, actorId: string) {
    // One lock shared by all admin mutations; serialize count+write and actor revalidation.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(71400601)`;
    const actor = await tx.user.findUnique({ where: { id: actorId } });
    if (actor?.status !== 'ACTIVE' || actor.role !== 'ADMIN')
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Quyền quản trị không còn hiệu lực.',
      });
  }
  async create(actorId: string, input: CreateUser) {
    try {
      return await this.db.$transaction(async (tx) => {
        await this.authorized(tx, actorId);
        return tx.user.create({ data: input });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException({
          code: 'USERNAME_EXISTS',
          message: 'Tên đăng nhập đã được sử dụng.',
        });
      throw error;
    }
  }
  update(actorId: string, id: string, input: UpdateUser) {
    return this.db.$transaction(async (tx) => {
      await this.authorized(tx, actorId);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
      const user = await tx.user.findUnique({ where: { id } });
      if (!user)
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'Không tìm thấy tài khoản.',
        });
      const changedSecurity =
        (input.role !== undefined && input.role !== user.role) ||
        (input.status !== undefined && input.status !== user.status);
      const losesAdmin =
        user.role === 'ADMIN' &&
        user.status === 'ACTIVE' &&
        ((input.role !== undefined && input.role !== 'ADMIN') ||
          input.status === 'LOCKED');
      if (
        losesAdmin &&
        (await tx.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } })) <=
          1
      )
        throw new ConflictException({
          code: 'LAST_ACTIVE_ADMIN',
          message: 'Không thể khóa hoặc hạ quyền Admin hoạt động cuối cùng.',
        });
      if (changedSecurity)
        await tx.refreshSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      return tx.user.update({
        where: { id },
        data: {
          ...input,
          ...(changedSecurity ? { tokenVersion: { increment: 1 } } : {}),
        },
      });
    });
  }
}
