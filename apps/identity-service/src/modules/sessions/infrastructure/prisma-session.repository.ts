import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { Principal } from '@minimart/auth';
import type { IdentityUser } from '../../users/domain/user.repository';
import type {
  NewSession,
  SessionRepository,
} from '../domain/session.repository';
@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaService) {}
  create(user: IdentityUser, session: NewSession) {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.id}, 0))`;
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (
        !current ||
        current.status !== 'ACTIVE' ||
        current.tokenVersion !== user.tokenVersion ||
        current.passwordHash !== user.passwordHash
      )
        return null;
      await tx.refreshSession.create({ data: { ...session, userId: user.id } });
      return tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    });
  }
  async rotate(tokenHash: string, session: NewSession) {
    const original = await this.db.refreshSession.findUnique({
      where: { tokenHash },
    });
    if (!original) return null;
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${original.userId}, 0))`;
      const current = await tx.refreshSession.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (!current) return null;
      if (
        current.revokedAt ||
        current.expiresAt <= new Date() ||
        current.user.status !== 'ACTIVE'
      ) {
        // Commit revocation even on replay; don't throw inside the transaction.
        await tx.refreshSession.updateMany({
          where: { familyId: current.familyId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return null;
      }
      await tx.refreshSession.update({
        where: { id: current.id },
        data: { revokedAt: new Date() },
      });
      await tx.refreshSession.create({
        data: {
          ...session,
          familyId: current.familyId,
          userId: current.userId,
        },
      });
      return current.user;
    });
  }
  async revoke(tokenHash: string) {
    const session = await this.db.refreshSession.findUnique({
      where: { tokenHash },
    });
    if (!session) return;
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${session.userId}, 0))`;
      await tx.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
  async authenticate(principal: Principal) {
    const session = await this.db.refreshSession.findFirst({
      where: {
        id: principal.sid,
        userId: principal.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: {
          status: 'ACTIVE',
          tokenVersion: principal.version,
          role: principal.role,
        },
      },
      include: { user: true },
    });
    return session?.user ?? null;
  }
  changePassword(userId: string, previousHash: string, passwordHash: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (
        !user ||
        user.status !== 'ACTIVE' ||
        user.passwordHash !== previousHash
      )
        return false;
      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return true;
    });
  }
}
