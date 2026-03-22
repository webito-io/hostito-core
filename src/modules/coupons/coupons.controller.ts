import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { FindCouponDto } from './dto/find-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('coupons', 'create', 'all')
  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('coupons', 'read', 'all')
  @Get()
  findAll(@Query() query: FindCouponDto) {
    return this.couponsService.findAll(query);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('coupons', 'read', 'all')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.findOne(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('coupons', 'update', 'all')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('coupons', 'delete', 'all')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.remove(id);
  }
}
