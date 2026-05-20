import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, ParseIntPipe } from '@nestjs/common';
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

@Get(':id/balance')
  async getBalance(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getBalance(id);
  }
}
