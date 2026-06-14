import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/authenticate';

export const paymentRouter = Router();

paymentRouter.use(authenticate);

paymentRouter.post('/process',          paymentController.process);
paymentRouter.get('/my',                paymentController.getMyPayments);
paymentRouter.get('/order/:orderId',    paymentController.getByOrder);
paymentRouter.get('/:id',              paymentController.getStatus);
