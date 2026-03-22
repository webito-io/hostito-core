import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FindCouponDto } from './dto/find-coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const coupon = await this.prisma.coupon.create({
      data: {
        code: createCouponDto.code,
        type: createCouponDto.type,
        value: createCouponDto.value,
        currencyId: createCouponDto.currencyId,
        maxUses: createCouponDto.maxUses,
        expiresAt:
          createCouponDto.expiresAt && new Date(createCouponDto.expiresAt),
        isActive: createCouponDto.isActive ?? true,
      },
    });

    return coupon;
  }

  async findAll({ page, limit }: FindCouponDto) {
    const pageNumber = Math.max(1, page || 1);
    const pageSize = Math.max(1, limit || 10);
    const skip = (pageNumber - 1) * pageSize;
    const [coupons, total] = await this.prisma.$transaction([
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.coupon.count(),
    ]);

    return { data: coupons, total };
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
