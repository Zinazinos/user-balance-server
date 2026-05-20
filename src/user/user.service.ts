// src/user/user.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserCacheService } from './user-cache.service';
import { DebitBalanceDto } from './dto/debit-balance-dto';
import { Prisma } from '@prisma/client';

interface LockUserResult {
  id: number;
  balance: Prisma.Decimal;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userCache: UserCacheService,
  ) {}

  async debitBalance(dto: DebitBalanceDto) {
    const { userId, amount } = dto;

    if (amount <= 0) {
      throw new BadRequestException('Сумма списания должна быть больше нуля');
    }
    let result;

    try {
      result = await this.prisma.$transaction(
        async (tx) => {
          const users = await tx.$queryRaw<LockUserResult[]>`
          SELECT id, balance FROM users WHERE id = ${userId} FOR UPDATE
        `;

          const user = users[0];
          if (!user) {
            throw new NotFoundException(
              `Пользователь с ID ${userId} не найден`,
            );
          }

          const currentBalance = new Prisma.Decimal(user.balance);
          const debitAmount = new Prisma.Decimal(amount);

          if (currentBalance.lessThan(debitAmount)) {
            throw new BadRequestException(
              `Недостаточно средств. Текущий баланс: $${currentBalance.toFixed(2)}`,
            );
          }

          await tx.balanceHistory.create({
            data: {
              userId: userId,
              action: 'debit',
              amount: amount,
            },
          });
          const historyAggregate = await tx.balanceHistory.findMany({
            where: { userId: userId },
          });
          const calculatedBalance = historyAggregate.reduce((acc, record) => {
            const recordAmount = new Prisma.Decimal(record.amount);
            return record.action === 'credit'
              ? acc.plus(recordAmount)
              : acc.minus(recordAmount);
          }, new Prisma.Decimal(0));

          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { balance: calculatedBalance  },
            include: {
              history: { orderBy: { ts: 'desc' }, take: 5 },
            },
          });

          return {
            success: true,
            message: `Списание $${debitAmount.toFixed(2)} выполнено успешно`,
            userId: updatedUser.id,
            balance: updatedUser.balance.toNumber(),
            recentHistory: updatedUser.history,
          };
        },
        { timeout: 5000 },
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Ошибка при списании баланса для пользователя ${userId}:`,
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        'Ошибка при обработке транзакции списания',
      );
    }

    await this.userCache.setBalance(userId, result.balance);
    return result;
  }

  async getBalance(userId: number) {
    const cachedBalance = await this.userCache.getBalance(userId);
    if (cachedBalance !== null) {
      return { userId, balance: cachedBalance, fromCache: true };
    }

    this.logger.log(`Баланс пользователя ${userId} взят из БАЗЫ ДАННЫХ`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    const balanceNumber = Number(user.balance);

    await this.userCache.setBalance(userId, balanceNumber);

    return { userId, balance: balanceNumber, fromCache: false };
  }
}
