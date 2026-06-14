import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/authenticate';
import { optionalAuth } from '../middlewares/optionalAuth';
import { validate } from '../middlewares/validate';
import {
  addToCartDto,
  updateCartItemDto,
  mergeCartDto,
} from '../dto/cart.dto';

export const cartRouter = Router();

/**
 * Public + authenticated routes (optionalAuth)
 * These work for both guests (via sessionId header) and authenticated users
 */

// GET /api/cart — view cart (guest or user)
cartRouter.get('/', optionalAuth, cartController.getCart);

// POST /api/cart/items — add item (guest or user)
cartRouter.post(
  '/items',
  optionalAuth,
  validate(addToCartDto),
  cartController.addItem
);

// PUT /api/cart/items/:productId — update quantity (guest or user)
cartRouter.put(
  '/items/:productId',
  optionalAuth,
  validate(updateCartItemDto),
  cartController.updateItem
);

// DELETE /api/cart/items/:productId — remove item (guest or user)
cartRouter.delete(
  '/items/:productId',
  optionalAuth,
  cartController.removeItem
);

// DELETE /api/cart — clear entire cart (guest or user)
cartRouter.delete('/', optionalAuth, cartController.clearCart);

/**
 * Authenticated-only routes
 */

// POST /api/cart/merge — merge guest cart after login
cartRouter.post(
  '/merge',
  authenticate,
  validate(mergeCartDto),
  cartController.mergeCart
);

// GET /api/cart/checkout — validate cart before order placement
cartRouter.get('/checkout', authenticate, cartController.getCheckoutCart);
