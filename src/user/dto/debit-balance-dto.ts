import { IsInt, IsPositive, IsNumber, Min } from 'class-validator';

export class DebitBalanceDto {
  @IsInt({ message: 'ID пользователя должен быть целым числом' })
  userId!: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Сумма должна быть числом (макс. 2 знака после запятой)' })
  @IsPositive({ message: 'Сумма списания должна быть больше нуля' })
  amount!: number;
}
