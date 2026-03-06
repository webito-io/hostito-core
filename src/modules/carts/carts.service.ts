import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto } from './dto/cart-item.dto';
import { User } from 'generated/prisma/client';

@Injectable()
export class CartsService {

  constructor(private readonly prisma: PrismaService) { }

  async add(cartData: CartItemDto, currentUser: User) {

    const cartFind = await this.prisma.cart.findUnique({
      where: {
        organizationId: currentUser.organizationId,
      },
    });

    let cartId = cartFind?.id;
    if (!cartFind) {
      const cartCreate = await this.prisma.cart.upsert({
        where: { organizationId: currentUser.organizationId },
        update: {},
        create: { organizationId: currentUser.organizationId },
      });
      cartId = cartCreate.id;
    }

    if (!cartId) {
      throw new NotFoundException('Cart not found');
    }

    const CartItem = await this.prisma.cartItem.create({
      data: {
        cartId: cartId,
        productId: cartData.productId,
        quantity: cartData.quantity,
        config: cartData.config,
      }
    });

    return CartItem;
  }

  async findOne(currentUser : User) {

    const cart = await this.prisma.cart.findUnique({
      where: {
        organizationId: currentUser.organizationId,
      },
      include: { items: { include: { product: true } } }
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }

  async update(id: number, cartData: CartItemDto) {

    const cart = await this.prisma.cartItem.update({
      where: {
        id: id,
      },
      data: {
        config: cartData.config,
        quantity: cartData.quantity,
      }
    });

    return cart;
  }

  async remove(id: number) {
    const deletedCart = await this.prisma.cartItem.delete({
      where: {
        id: id,
      },
    });
    return deletedCart;
  }

  async removeAll() {
    await this.prisma.cartItem.deleteMany();
    await this.prisma.cart.deleteMany();
    return { message: 'All carts and cart items have been deleted' };
  }
}