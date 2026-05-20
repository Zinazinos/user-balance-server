import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager'; // Импортируем кэш
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60000,
      max: 100,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
