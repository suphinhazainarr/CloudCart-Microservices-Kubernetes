import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { successResponse } from '@cloudcart/shared';
import { processPaymentDto } from '../dto/payment.dto';

class PaymentController {

  process = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto         = processPaymentDto.parse(req.body);
      const accessToken = req.headers.authorization?.split(' ')[1]
        ?? req.cookies?.accessToken ?? '';

      const payment = await paymentService.processPayment(
        dto,
        req.user!.userId,
        accessToken
      );
      res.status(200).json(successResponse('Payment processed successfully', { payment }));
    } catch (error) { next(error); }
  };

  getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await paymentService.getPaymentStatus(
        req.params.id,
        req.user!.userId
      );
      res.status(200).json(successResponse('Payment status retrieved', { payment }));
    } catch (error) { next(error); }
  };

  getByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await paymentService.getPaymentByOrder(
        req.params.orderId,
        req.user!.userId
      );
      res.status(200).json(successResponse('Payment retrieved', { payment }));
    } catch (error) { next(error); }
  };

  getMyPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payments = await paymentService.getUserPayments(req.user!.userId);
      res.status(200).json(successResponse('Payments retrieved', { payments }));
    } catch (error) { next(error); }
  };
}

export const paymentController = new PaymentController();
