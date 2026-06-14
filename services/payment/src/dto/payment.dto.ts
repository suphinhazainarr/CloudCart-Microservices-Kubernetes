import { z } from 'zod';

export const processPaymentDto = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  method:  z.enum(['credit_card', 'debit_card', 'upi', 'net_banking']),
  // Simulated card details — in production these never reach your server
  // They go directly to Stripe/Razorpay and you get a token back
  cardDetails: z.object({
    number:  z.string().length(16, 'Card number must be 16 digits').regex(/^\d+$/),
    expiry:  z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
    cvv:     z.string().length(3, 'CVV must be 3 digits').regex(/^\d+$/),
    name:    z.string().min(2, 'Cardholder name required'),
  }).optional(),
});

export type ProcessPaymentDto = z.infer<typeof processPaymentDto>;
