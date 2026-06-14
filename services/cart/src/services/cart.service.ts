import { getRedisClient } from '../config/redis';
import { productClient, ProductSnapshot } from './product.client';
import { CartSnapshot } from '../models/CartSnapshot.model';
import { ICartItem } from '../models/CartSnapshot.model';
import { AddToCartDto, UpdateCartItemDto } from '../dto/cart.dto';
import { ValidationError, NotFoundError } from '@cloudcart/shared';
import { env } from '../config/env';

// What the full cart response looks like
export interface CartResponse {
  items:      ICartItem[];
  total:      number;
  itemCount:  number;
  totalItems: number; // sum of all quantities
}

// Redis key builders — centralised so they never drift out of sync
const KEYS = {
  userCart:  (userId: string)    => `cart:user:${userId}`,
  guestCart: (sessionId: string) => `cart:guest:${sessionId}`,
};

class CartService {
  private redis = getRedisClient();

  // ─── Get cart key ─────────────────────────────────────────────────────────
  // Decides which key to use based on whether the user is authenticated

  private getCartKey(userId?: string, sessionId?: string): string {
    if (userId)    return KEYS.userCart(userId);
    if (sessionId) return KEYS.guestCart(sessionId);
    throw new ValidationError('Either userId or sessionId is required');
  }

  private getTTL(userId?: string): number {
    return userId ? env.CART_TTL_AUTHENTICATED : env.CART_TTL_GUEST;
  }

  // ─── Get cart ─────────────────────────────────────────────────────────────

  async getCart(userId?: string, sessionId?: string): Promise<CartResponse> {
    const key = this.getCartKey(userId, sessionId);

    // HGETALL returns all fields of the hash in one round trip
    // Each field is: { productId: serialisedCartItem }
    const rawItems = await this.redis.hgetall(key);

    if (!rawItems || Object.keys(rawItems).length === 0) {
      return { items: [], total: 0, itemCount: 0, totalItems: 0 };
    }

    // Deserialise all items
    const items: ICartItem[] = Object.values(rawItems).map((raw) =>
      JSON.parse(raw)
    );

    return this.buildCartResponse(items);
  }

  // ─── Add to cart ──────────────────────────────────────────────────────────

  async addToCart(
    dto: AddToCartDto,
    userId?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const key = this.getCartKey(userId, sessionId);

    // Always verify product details fresh from the product service
    // Never trust client-sent prices — always use server-side price
    const product = await productClient.getProduct(dto.productId);

    if (product.stock <= 0) {
      throw new ValidationError('This product is out of stock');
    }

    // Check if item already exists in cart
    const existingRaw = await this.redis.hget(key, dto.productId);
    let newQuantity = dto.quantity;

    if (existingRaw) {
      const existing: ICartItem = JSON.parse(existingRaw);
      newQuantity = existing.quantity + dto.quantity;
    }

    // Validate against available stock
    if (newQuantity > product.stock) {
      throw new ValidationError(
        `Only ${product.stock} units available. You already have ${
          existingRaw ? JSON.parse(existingRaw).quantity : 0
        } in your cart.`
      );
    }

    const cartItem: ICartItem = {
      productId: dto.productId,
      name:      product.name,
      price:     product.price,  // price locked at time of adding — honest pricing
      image:     product.image,
      quantity:  newQuantity,
      stock:     product.stock,
      slug:      product.slug,
    };

    // HSET sets one field in the hash — atomic, doesn't affect other items
    await this.redis.hset(key, dto.productId, JSON.stringify(cartItem));

    // Refresh TTL — every interaction resets the expiry window
    await this.redis.expire(key, this.getTTL(userId));

    return this.getCart(userId, sessionId);
  }

  // ─── Update item quantity ─────────────────────────────────────────────────

  async updateItem(
    productId: string,
    dto: UpdateCartItemDto,
    userId?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const key = this.getCartKey(userId, sessionId);

    const existingRaw = await this.redis.hget(key, productId);
    if (!existingRaw) {
      throw new NotFoundError('Cart item');
    }

    const existing: ICartItem = JSON.parse(existingRaw);

    // Re-validate stock with current product data
    const product = await productClient.getProduct(productId);

    if (dto.quantity > product.stock) {
      throw new ValidationError(
        `Only ${product.stock} units available`
      );
    }

    const updatedItem: ICartItem = {
      ...existing,
      quantity: dto.quantity,
      stock:    product.stock,  // refresh stock so UI can show live availability
      price:    product.price,  // refresh price — catches price changes
    };

    await this.redis.hset(key, productId, JSON.stringify(updatedItem));
    await this.redis.expire(key, this.getTTL(userId));

    return this.getCart(userId, sessionId);
  }

  // ─── Remove item ──────────────────────────────────────────────────────────

  async removeItem(
    productId: string,
    userId?: string,
    sessionId?: string
  ): Promise<CartResponse> {
    const key = this.getCartKey(userId, sessionId);

    // HDEL removes a specific field from the hash
    const deleted = await this.redis.hdel(key, productId);
    if (deleted === 0) {
      throw new NotFoundError('Cart item');
    }

    await this.redis.expire(key, this.getTTL(userId));
    return this.getCart(userId, sessionId);
  }

  // ─── Clear cart ───────────────────────────────────────────────────────────

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    const key = this.getCartKey(userId, sessionId);
    await this.redis.del(key);
  }

  // ─── Merge guest → user cart ──────────────────────────────────────────────

  async mergeGuestCart(userId: string, sessionId: string): Promise<CartResponse> {
    const guestKey = KEYS.guestCart(sessionId);
    const userKey  = KEYS.userCart(userId);

    // Get guest cart items
    const guestRaw = await this.redis.hgetall(guestKey);

    if (!guestRaw || Object.keys(guestRaw).length === 0) {
      // No guest cart to merge — just return user cart
      return this.getCart(userId);
    }

    const guestItems: ICartItem[] = Object.values(guestRaw).map((r) =>
      JSON.parse(r)
    );

    // Get user cart
    const userRaw = await this.redis.hgetall(userKey);
    const userItems: Record<string, ICartItem> = {};

    if (userRaw) {
      Object.values(userRaw).forEach((r) => {
        const item: ICartItem = JSON.parse(r);
        userItems[item.productId] = item;
      });
    }

    // Merge strategy: for duplicate products, take higher quantity (capped at stock)
    for (const guestItem of guestItems) {
      const userItem = userItems[guestItem.productId];

      if (userItem) {
        // Product exists in both carts — take max quantity, respect stock
        const mergedQty = Math.min(
          Math.max(userItem.quantity, guestItem.quantity),
          guestItem.stock
        );
        userItems[guestItem.productId] = { ...userItem, quantity: mergedQty };
      } else {
        // Product only in guest cart — add to user cart
        userItems[guestItem.productId] = guestItem;
      }
    }

    // Write merged cart back to Redis using pipeline for atomicity
    // Pipeline sends all commands in one round trip — much faster than individual calls
    const pipeline = this.redis.pipeline();

    pipeline.del(userKey); // clear existing user cart first

    for (const [productId, item] of Object.entries(userItems)) {
      pipeline.hset(userKey, productId, JSON.stringify(item));
    }

    pipeline.expire(userKey, env.CART_TTL_AUTHENTICATED);
    pipeline.del(guestKey); // clean up guest cart

    await pipeline.exec();

    return this.getCart(userId);
  }

  // ─── Get cart for order creation ─────────────────────────────────────────
  // Called by the order service to get validated cart items before placing an order

  async getCartForCheckout(userId: string): Promise<CartResponse> {
    const cart = await this.getCart(userId);

    if (cart.items.length === 0) {
      throw new ValidationError('Your cart is empty');
    }

    // Re-validate ALL items against current product data before checkout
    // This catches price changes and stock depletion between add-to-cart and checkout
    const validationErrors: string[] = [];

    for (const item of cart.items) {
      try {
        const product = await productClient.getProduct(item.productId);

        if (!product.isActive) {
          validationErrors.push(`"${item.name}" is no longer available`);
          continue;
        }

        if (product.stock < item.quantity) {
          validationErrors.push(
            `"${item.name}" only has ${product.stock} units available (you have ${item.quantity} in cart)`
          );
        }
      } catch {
        validationErrors.push(`Unable to verify "${item.name}"`);
      }
    }

    if (validationErrors.length > 0) {
      throw new ValidationError(
        `Cart validation failed:\n${validationErrors.join('\n')}`
      );
    }

    return cart;
  }

  // ─── Save snapshot to MongoDB ─────────────────────────────────────────────
  // Called just before order creation — persists cart to MongoDB for the order service

  async saveCartSnapshot(userId: string): Promise<ICartItem[]> {
    const cart = await this.getCartForCheckout(userId);

    await CartSnapshot.findOneAndUpdate(
      { userId },
      {
        userId,
        items:      cart.items,
        total:      cart.total,
        itemCount:  cart.itemCount,
      },
      { upsert: true, new: true }
    );

    return cart.items;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private buildCartResponse(items: ICartItem[]): CartResponse {
    const total      = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      total:      Math.round(total * 100) / 100,  // round to 2 decimal places
      itemCount:  items.length,                    // number of distinct products
      totalItems,                                  // total quantity across all items
    };
  }
}

export const cartService = new CartService();
