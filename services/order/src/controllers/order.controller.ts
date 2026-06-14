import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { successResponse } from '@cloudcart/shared';
import { createOrderDto, updateOrderStatusDto, orderQueryDto } from '../dto/order.dto';

class OrderController {

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = createOrderDto.parse(req.body);

      // Extract the raw access token — needed to call cart + product services
      const accessToken = req.headers.authorization?.split(' ')[1]
        ?? req.cookies?.accessToken ?? '';

      const order = await orderService.createOrder(dto, req.user!.userId, accessToken);
      res.status(201).json(successResponse('Order placed successfully', { order }));
    } catch (error) { next(error); }
  };

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query    = orderQueryDto.parse(req.query);
      const isAdmin  = req.user!.role === 'admin';
      const result   = await orderService.getOrders(query, req.user!.userId, isAdmin);
      res.status(200).json(
        successResponse('Orders retrieved', { orders: result.orders }, result.meta)
      );
    } catch (error) { next(error); }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAdmin = req.user!.role === 'admin';
      const order   = await orderService.getOrderById(
        req.params.id,
        req.user!.userId,
        isAdmin
      );
      res.status(200).json(successResponse('Order retrieved', { order }));
    } catch (error) { next(error); }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto   = updateOrderStatusDto.parse(req.body);
      const order = await orderService.updateOrderStatus(req.params.id, dto);
      res.status(200).json(successResponse('Order status updated', { order }));
    } catch (error) { next(error); }
  };

  cancelOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1]
        ?? req.cookies?.accessToken ?? '';
      const isAdmin = req.user!.role === 'admin';
      const order   = await orderService.cancelOrder(
        req.params.id,
        req.user!.userId,
        isAdmin,
        accessToken
      );
      res.status(200).json(successResponse('Order cancelled', { order }));
    } catch (error) { next(error); }
  };

  // Internal endpoint — called by payment service only
  updatePaymentResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId, status } = req.body;
      const order = await orderService.updatePaymentResult(
        req.params.id,
        paymentId,
        status
      );
      res.status(200).json(successResponse('Order payment updated', { order }));
    } catch (error) { next(error); }
  };

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await orderService.getOrderStats();
      res.status(200).json(successResponse('Order statistics retrieved', { stats }));
    } catch (error) { next(error); }
  };
}

export const orderController = new OrderController();
