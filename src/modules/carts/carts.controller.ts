import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequirePermission } from 'src/common/decorators/permission.decorator';
import { PermissionsGuard } from 'src/common/guards/permission.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CartsService } from './carts.service';
import { CartItemDto } from './dto/cart-item.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) { }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('/cart-item')
  create(@Body() createCartDto: CartItemDto, @Req() req) {
    return this.cartsService.add(createCartDto, req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get('')
  findOne(@Req() req) {
    return this.cartsService.findOne(req.user);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Patch('/cart-item/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCartDto: CartItemDto) {
    return this.cartsService.update(id, updateCartDto);
  }



  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Delete('/cart-item/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cartsService.remove(id);
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermission('carts', 'delete', 'all')
  @Delete()
  removeAll() {
    return this.cartsService.removeAll();
  }
}
