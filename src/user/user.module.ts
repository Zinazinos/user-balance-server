// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager'; // Импорт отсюда
import { UserService } from './user.service';
import { UserCacheService } from './user-cache.service';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(),
  ],
  controllers: [UserController],
  providers: [UserService, UserCacheService],
})
export class UserModule {}
