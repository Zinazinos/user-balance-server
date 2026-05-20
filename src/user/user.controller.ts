import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { DebitBalanceDto } from './dto/debit-balance-dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('debit')
  @HttpCode(HttpStatus.OK)
  async debit(@Body() dto: DebitBalanceDto) {
    return await this.userService.debitBalance(dto);
  }
}
