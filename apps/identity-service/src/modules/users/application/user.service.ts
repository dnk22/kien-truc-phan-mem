import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import {
  USER_REPOSITORY,
  type CreateUser,
  type UserRepository,
  type UserQuery,
  type UpdateUser,
} from '../domain/user.repository';
import { userProfile } from './user.mapper';
@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}
  async list(query: UserQuery) {
    const result = await this.users.list(query);
    return { ...result, items: result.items.map(userProfile) };
  }
  async get(id: string) {
    const user = await this.users.findById(id);
    if (!user)
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Không tìm thấy tài khoản.',
      });
    return userProfile(user);
  }
  async create(
    actor: string,
    dto: Omit<CreateUser, 'passwordHash'> & { password: string },
  ) {
    const { password, ...input } = dto;
    return userProfile(
      await this.users.create(actor, {
        ...input,
        passwordHash: await hash(password, 12),
      }),
    );
  }
  async update(actor: string, id: string, dto: UpdateUser) {
    return userProfile(await this.users.update(actor, id, dto));
  }
}
