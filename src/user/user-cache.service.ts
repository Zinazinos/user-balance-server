// src/user/user-cache.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class UserCacheService {
  private readonly logger = new Logger(UserCacheService.name);
  private readonly TTL_5_MIN = 300000; 

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private getBalanceKey(userId: number): string {
    return `user_balance_${userId}`;
  }

  async getBalance(userId: number): Promise<number | null> {
    const key = this.getBalanceKey(userId);
    const cached = await this.cacheManager.get<number>(key);
    
    if (cached !== undefined && cached !== null) {
      this.logger.log(`Баланс пользователя ${userId} взят из КЭША`);
      return cached;
    }
    return null;
  }

  async setBalance(userId: number, balance: number): Promise<void> {
    const key = this.getBalanceKey(userId);
    await this.cacheManager.set(key, balance, this.TTL_5_MIN);
    this.logger.log(`Кэш баланса для пользователя ${userId} обновлен: ${balance}`);
  }

  async invalidateBalance(userId: number): Promise<void> {
    const key = this.getBalanceKey(userId);
    await this.cacheManager.del(key);
    this.logger.log(`Кэш баланса для пользователя ${userId} удален`);
  }
}
