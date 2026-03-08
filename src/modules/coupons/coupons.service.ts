import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: createCouponDto.code,
        type: createCouponDto.type,
        value: createCouponDto.value,
        currencyId: createCouponDto.currencyId,
        maxUses: createCouponDto.maxUses,
        expiresAt: createCouponDto.expiresAt
          ? new Date(createCouponDto.expiresAt)
          : null,
        isActive: createCouponDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon with ID ${id} not found`);
    return coupon;
  }

  async update(id: number, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon with ID ${id} not found`);
    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: updateCouponDto.code,
        type: updateCouponDto.type,
        value: updateCouponDto.value,
        currencyId: updateCouponDto.currencyId,
        maxUses: updateCouponDto.maxUses,
        expiresAt:
          updateCouponDto.expiresAt && new Date(updateCouponDto.expiresAt),
        isActive: updateCouponDto.isActive,
      },
    });
  }

  async remove(id: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon with ID ${id} not found`);
    return this.prisma.coupon.delete({ where: { id } });
  }
}
