import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

export const orderRouter = Router();

// All order routes require authentication
orderRouter.use(authenticate);

// Customer + Admin
orderRouter.post('/',           orderController.createOrder);
orderRouter.get('/',            orderController.getOrders);
orderRouter.get('/:id',         orderController.getOrderById);
orderRouter.post('/:id/cancel', orderController.cancelOrder);

// Admin only
orderRouter.patch('/:id/status',  authorize('admin'), orderController.updateStatus);
orderRouter.get('/admin/stats',   authorize('admin'), orderController.getStats);

// Internal — called by payment service (in production, lock this behind internal network)
orderRouter.patch('/:id/payment', orderController.updatePaymentResult);
