import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto } from './dto/cart-item.dto';
import { User } from '@prisma/client';
import { CouponsCalculator } from '../coupons/coupons.calculator';

@Injectable()
export class CartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsCalculator: CouponsCalculator,
  ) {}

  /**
   * Add a product to the cart
   * @param cartData
   * @param currentUser
   * @returns
   */
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

    const product = await this.prisma.product.findUnique({
      where: { id: cartData.productId },
    });
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    const CartItem = await this.prisma.cartItem.create({
      data: {
        cartId: cartId,
        productId: cartData.productId,
        quantity: cartData.quantity,
        config: cartData.config,
      },
    });

    return CartItem;
  }

  /**
   * Find a cart by organization ID
   * @param currentUser
   * @returns
   */
  async findOne(currentUser: User, couponCode?: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const cart = await this.prisma.cart.findUnique({
      where: {
        organizationId: currentUser.organizationId,
      },
      include: { items: { include: { product: true } } },
    });
    if (!cart) {
      return { total: 0, discount: 0, tax: 0, subtotal: 0 };
    }

    // Calculate the total price of the cart
    let total = 0;
    let discount = 0;
    let tax = 0;
    let subtotal = 0;
    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        subtotal += product.price * item.quantity;
      }
    }
    total = subtotal;

    /* check coupon */
    if (couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: {
          code: couponCode,
        },
      });
      if (coupon) {
        const couponDiscount = await this.couponsCalculator.calculateDiscount(
          coupon,
          subtotal,
          organization.currencyId,
        );
        discount += couponDiscount;
        total -= couponDiscount;
      }
    }

    /* Apply tax */
    const taxRates = await this.prisma.tax.findMany({
      where: {
        isActive: true,
      },
    });
    const sumRate = taxRates.reduce((acc, t) => acc + t.rate, 0);
    tax = total * (sumRate / 100);
    total += tax;

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return {
      ...cart,
      total,
      discount,
      tax,
      subtotal,
    };
  }

  /**
   * Update a cart item
   * @param id
   * @param cartData
   * @returns
   */
  async update(id: number, cartData: CartItemDto, currentUser: User) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id,
        cart: { organizationId: currentUser.organizationId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.update({
      where: { id },
      data: {
        config: cartData.config,
        quantity: cartData.quantity,
      },
    });
  }

  /**
   * Remove a cart item
   * @param id
   * @returns
   */
  async remove(id: number, currentUser: User) {
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id,
        cart: { organizationId: currentUser.organizationId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id },
    });
  }

  /**
   * Remove all cart items
   * @returns
   */
  async removeAll() {
    await this.prisma.cartItem.deleteMany();
    await this.prisma.cart.deleteMany();
    return { message: 'All carts and cart items have been deleted' };
  }
}
