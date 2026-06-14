import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';
import { successResponse } from '@cloudcart/shared';

class CartController {

  // Helper to extract userId and sessionId from request
  private getIdentifiers(req: Request) {
    return {
      userId:    req.user?.userId,
      sessionId: req.sessionId,
    };
  }

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cart = await cartService.getCart(userId, sessionId);
      res.status(200).json(successResponse('Cart retrieved', { cart }));
    } catch (error) { next(error); }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cart = await cartService.addToCart(req.body, userId, sessionId);
      res.status(200).json(successResponse('Item added to cart', { cart }));
    } catch (error) { next(error); }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cart = await cartService.updateItem(
        req.params.productId,
        req.body,
        userId,
        sessionId
      );
      res.status(200).json(successResponse('Cart updated', { cart }));
    } catch (error) { next(error); }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      const cart = await cartService.removeItem(
        req.params.productId,
        userId,
        sessionId
      );
      res.status(200).json(successResponse('Item removed', { cart }));
    } catch (error) { next(error); }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, sessionId } = this.getIdentifiers(req);
      await cartService.clearCart(userId, sessionId);
      res.status(200).json(successResponse('Cart cleared', null));
    } catch (error) { next(error); }
  };

  mergeCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // This endpoint is called right after login with a sessionId in the body
      const { sessionId } = req.body;
      const cart = await cartService.mergeGuestCart(req.user!.userId, sessionId);
      res.status(200).json(successResponse('Cart merged', { cart }));
    } catch (error) { next(error); }
  };

  getCheckoutCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cart = await cartService.getCartForCheckout(req.user!.userId);
      res.status(200).json(successResponse('Cart validated for checkout', { cart }));
    } catch (error) { next(error); }
  };
}

export const cartController = new CartController();
