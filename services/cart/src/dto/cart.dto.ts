import { z } from 'zod';

export const addToCartDto = z.object({
  productId: z
    .string({ required_error: 'Product ID is required' })
    .min(1, 'Product ID is required'),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Cannot add more than 100 of a single item'),
});

export const updateCartItemDto = z.object({
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Cannot exceed 100 of a single item'),
});

export const mergeCartDto = z.object({
  sessionId: z
    .string({ required_error: 'Session ID is required' })
    .min(1, 'Session ID is required'),
});

export type AddToCartDto      = z.infer<typeof addToCartDto>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemDto>;
export type MergeCartDto      = z.infer<typeof mergeCartDto>;
