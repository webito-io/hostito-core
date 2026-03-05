import { Injectable } from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurrenciesService {


  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    /* Create default currency if it doesn't exist */
    await this.prisma.currency.upsert({
      where: { code: 'USD' },
      update: {},
      create: {
        name: 'US Dollar',
        code: 'USD',
        symbol: '$',
        rate: 1,
        isDefault: true,
        isActive: true,
      },
    });  
  }


  create(createCurrencyDto: CreateCurrencyDto) {
    return 'This action adds a new currency';
  }

  findAll() {
    return `This action returns all currencies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} currency`;
  }

  update(id: number, updateCurrencyDto: UpdateCurrencyDto) {
    return `This action updates a #${id} currency`;
  }

  remove(id: number) {
    return `This action removes a #${id} currency`;
  }
}
