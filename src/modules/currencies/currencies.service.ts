import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { PrismaService } from '../prisma/prisma.service';
import { currencySelect } from './selects/currencies.select';
import { User } from 'generated/prisma/client';
import { hasPermission } from 'src/common/decorators/permission.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  /**
   * Create a new currency
   * @param createCurrencyDto
   * @returns
   */
  async create(createCurrencyDto: CreateCurrencyDto) {
    return this.prisma.currency.create({
      data: {
        code: createCurrencyDto.code,
        name: createCurrencyDto.name,
        symbol: createCurrencyDto.symbol,
        rate: createCurrencyDto.rate,
        isDefault: createCurrencyDto.isDefault ?? false,
        isActive: createCurrencyDto.isActive ?? true,
      },
      select: currencySelect,
    });
  }

  /**
   * Find all currencies
   * @param page
   * @param limit
   * @param user
   * @returns
   */
  async findAll(query: PaginationDto, user: User) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(!hasPermission(user, 'currencies', 'read', 'all') && { isActive: true }),
    };

    const [currencies, total] = await this.prisma.$transaction([
      this.prisma.currency.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: currencySelect,
        skip,
        take: limit,
      }),
      this.prisma.currency.count({ where }),
    ]);

    return {
      data: currencies,
      total,
      page,
      limit,
    };
  }

  /**
   * Find a currency by ID
   * @param id
   * @returns
   */
  async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
      select: currencySelect,
    });
    if (!currency) throw new NotFoundException(`Currency with ID ${id} not found`);
    return currency;
  }

  /**
   * Update a currency by ID
   * @param id
   * @param updateCurrencyDto
   * @returns
   */
  async update(id: number, updateCurrencyDto: UpdateCurrencyDto) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency with ID ${id} not found`);
    return this.prisma.currency.update({
      where: { id },
      data: {
        code: updateCurrencyDto.code,
        name: updateCurrencyDto.name,
        symbol: updateCurrencyDto.symbol,
        rate: updateCurrencyDto.rate,
        isDefault: updateCurrencyDto.isDefault,
        isActive: updateCurrencyDto.isActive,
      },
      select: currencySelect,
    });
  }

  /**
   * Remove a currency by ID
   * @param id
   * @returns
   */
  async remove(id: number) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency with ID ${id} not found`);
    return this.prisma.currency.delete({ where: { id } });
  }
}
