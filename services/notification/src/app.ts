import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { emailService } from './services/email.service';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'notification',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

app.post('/api/notifications/order-confirmed', async (req: Request, res: Response) => {
  const { orderId, userId } = req.body;
  console.log(`[notification] Received order confirmation event for Order: ${orderId}, User: ${userId}`);

  // Map to default seeded accounts if possible
  let email = 'john@example.com';
  let name = 'John';

  if (userId) {
    if (userId.toString().includes('admin')) {
      email = 'admin@cloudcart.dev';
      name = 'Admin';
    }
  }

  // Generate realistic mock order detail values
  const mockOrderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const mockTotal = parseFloat((149.99 + Math.random() * 850).toFixed(2));

  await emailService.sendOrderConfirmation({
    to: email,
    firstName: name,
    orderNumber: mockOrderNumber,
    total: mockTotal,
    status: 'confirmed',
  });

  res.status(200).json({
    success: true,
    message: 'Email confirmation logged successfully',
    data: {
      to: email,
      orderNumber: mockOrderNumber,
      total: mockTotal,
    },
  });
});

app.listen(env.PORT, () => {
  console.warn(`[notification] Running → http://localhost:${env.PORT}`);
});

export default app;
