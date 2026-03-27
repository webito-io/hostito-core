import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto } from './dto/cart-item.dto';
import { User } from '@prisma/client';
import { CouponsCalculator } from '../coupons/coupons.calculator';
import { TaxesCalculator } from '../taxes/taxes.calculator';

@Injectable()
export class CartsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsCalculator: CouponsCalculator,
    private readonly taxesCalculator: TaxesCalculator,
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
    if (product.type === 'DOMAIN') {
      throw new BadRequestException('Use /carts/domain to add domain products');
    }

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: cartData.variantId },
    });
    if (!variant || variant.productId !== product.id) {
      throw new NotFoundException('Variant not found for this product');
    }

    const CartItem = await this.prisma.cartItem.create({
      data: {
        cartId: cartId,
        productId: cartData.productId,
        variantId: cartData.variantId,
        quantity: cartData.quantity,
        config: cartData.config,
      },
    });

    return CartItem;
  }

  /**
   * Add a domain to the cart — resolves product by TLD
   */
  async addDomain(domain: string, currentUser: User) {
    const tld = '.' + domain.split('.').slice(1).join('.');

    const product = await this.prisma.product.findFirst({
      where: { type: 'DOMAIN', tld, isActive: true },
      include: { variants: true },
    });
    if (!product) {
      throw new NotFoundException(`No pricing found for TLD "${tld}"`);
    }

    const variant = product.variants.find((v) => v.action === 'REGISTER');
    if (!variant) {
      throw new NotFoundException(`No REGISTER variant found for "${tld}"`);
    }

    const cartId = await this.resolveCartId(currentUser);

    return this.prisma.cartItem.create({
      data: {
        cartId,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        config: { domain },
      },
    });
  }

  /**
   * Resolve or create cart for user
   */
  private async resolveCartId(currentUser: User): Promise<number> {
    const cart = await this.prisma.cart.upsert({
      where: { organizationId: currentUser.organizationId },
      update: {},
      create: { organizationId: currentUser.organizationId },
    });
    return cart.id;
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
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart) {
      return { total: 0, discount: 0, tax: 0, subtotal: 0 };
    }

    /* persist coupon on cart */
    const appliedCode = couponCode ?? cart.couponCode;
    if (couponCode !== undefined && couponCode !== cart.couponCode) {
      await this.prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: couponCode || null },
      });
    }

    // Calculate the total price of the cart
    let total = 0;
    let discount = 0;
    let tax = 0;
    let subtotal = 0;
    for (const item of cart.items) {
      subtotal += item.variant.price * item.quantity;
    }
    total = subtotal;

    /* check coupon */
    if (appliedCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: appliedCode },
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
    const taxRate = await this.taxesCalculator.getRate(organization.country);
    tax = parseFloat((total * (taxRate / 100)).toFixed(2));
    total += tax;

    return {
      ...cart,
      couponCode: appliedCode,
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
      include: { product: true },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.product.type === 'DOMAIN') {
      throw new BadRequestException('Domain items cannot be updated, remove and re-add instead');
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
