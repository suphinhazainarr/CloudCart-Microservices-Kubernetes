import { z } from 'zod';

const shippingAddressDto = z.object({
  fullName:   z.string().min(2, 'Full name required').max(100),
  street:     z.string().min(5, 'Street address required').max(200),
  city:       z.string().min(2, 'City required').max(100),
  state:      z.string().min(2, 'State required').max(100),
  postalCode: z.string().min(3, 'Postal code required').max(20),
  country:    z.string().min(2, 'Country required').max(100),
  phone:      z.string().min(7, 'Phone number required').max(20),
});

export const createOrderDto = z.object({
  shippingAddress: shippingAddressDto,
  notes:           z.string().max(500).optional(),
});

export const updateOrderStatusDto = z.object({
  status: z.enum([
    'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
  ]),
  note:          z.string().max(500).optional(),
  trackingNumber:z.string().max(100).optional(),
});

export const orderQueryDto = z.object({
  page:   z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit:  z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 50) : 10)),
  status: z.enum([
    'pending_payment','confirmed','processing','shipped','delivered','cancelled','payment_failed',
  ]).optional(),
});

export type CreateOrderDto       = z.infer<typeof createOrderDto>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusDto>;
export type OrderQueryDto        = z.infer<typeof orderQueryDto>;
