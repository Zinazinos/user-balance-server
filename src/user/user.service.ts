import { 
  Injectable, 
  BadRequestException, 
  NotFoundException, 
  InternalServerErrorException, 
  HttpException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DebitBalanceDto } from './dto/debit-balance-dto';
import { Prisma } from '@prisma/client';

interface LockUserResult {
  id: number;
  balance: Prisma.Decimal;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async debitBalance(dto: DebitBalanceDto) {
    const { userId, amount } = dto;
    
    if (amount <= 0) {
      throw new BadRequestException('Сумма списания должна быть больше нуля');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        
        const users = await tx.$queryRaw<LockUserResult[]>`
          SELECT id, balance FROM users WHERE id = ${userId} FOR UPDATE
        `;
        
        const user = users[0];

        if (!user) {
          throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
        }

        const currentBalance = new Prisma.Decimal(user.balance);
        const debitAmount = new Prisma.Decimal(amount);

        if (currentBalance.lessThan(debitAmount)) {
          throw new BadRequestException(
            `Недостаточно средств. Текущий баланс: $${currentBalance.toFixed(2)}`
          );
        }

        const newBalance = currentBalance.minus(debitAmount);

        await tx.balanceHistory.create({
          data: {
            userId: userId,
            action: 'debit',
            amount: amount,
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { 
            balance: newBalance 
          },
          include: {
            history: {
              orderBy: { ts: 'desc' },
              take: 5,
            },
          },
        });

        return {
          success: true,
          message: `Списание $${debitAmount.toFixed(2)} выполнено успешно`,
          userId: updatedUser.id,
          balance: updatedUser.balance.toNumber(),
          recentHistory: updatedUser.history,
        };
      }, {
        timeout: 5000 
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Ошибка при списании баланса для пользователя ${userId}:`, error instanceof Error ? error.stack : error);

      throw new InternalServerErrorException('Ошибка при обработке транзакции списания');
    }
  }
}
