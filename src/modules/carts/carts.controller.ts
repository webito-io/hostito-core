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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CartsService } from './carts.service';
import { CartItemDto } from './dto/cart-item.dto';
import { AddDomainDto } from './dto/add-domain.dto';
import { CartEntity, CartItemEntity } from './entities/cart.entity';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/cart-item')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added successfully',
    type: CartItemEntity,
  })
  async create(
    @Body() createCartDto: CartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartsService.add(createCartDto, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/domain')
  @ApiOperation({
    summary: 'Add domain to cart (resolves TLD pricing automatically)',
  })
  @ApiResponse({
    status: 201,
    description: 'Domain added to cart',
    type: CartItemEntity,
  })
  async addDomain(
    @Body() body: AddDomainDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartsService.addDomain(body.domain, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('')
  @ApiOperation({ summary: 'Get current cart (optionally apply a coupon)' })
  @ApiResponse({
    status: 200,
    description: 'Return current cart',
    type: CartEntity,
  })
  async getCart(
    @Req() req: AuthenticatedRequest,
    @Query() query: ApplyCouponDto,
  ) {
    return this.cartsService.findOne(req.user, query.couponCode);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('/cart-item/:id')
  @ApiOperation({ summary: 'Update item in cart' })
  @ApiResponse({
    status: 200,
    description: 'Item updated successfully',
    type: CartItemEntity,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCartDto: CartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartsService.update(id, updateCartDto, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete('/cart-item/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed successfully' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartsService.remove(id, req.user);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('carts', 'delete', 'all')
  @Delete()
  @ApiOperation({ summary: 'Delete all carts (Admin)' })
  @ApiResponse({ status: 200, description: 'All carts deleted' })
  async removeAll() {
    return this.cartsService.removeAll();
  }
}
