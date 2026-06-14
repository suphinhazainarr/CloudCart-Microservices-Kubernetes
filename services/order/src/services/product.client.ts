import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ValidationError } from '@cloudcart/shared';

class ProductClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.PRODUCT_SERVICE_URL,
      timeout: 5000,
    });
  }

  // Atomically decrement stock for multiple products
  // Called immediately after order creation — before payment
  async decrementStock(productId: string, quantity: number, accessToken: string): Promise<void> {
    try {
      await this.http.patch(
        `/api/products/${productId}/stock`,
        { quantity },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new ValidationError(error.response.data.message ?? 'Insufficient stock');
      }
      throw new ValidationError('Unable to update product stock');
    }
  }

  // Restore stock on payment failure or order cancellation
  async restoreStock(productId: string, quantity: number, accessToken: string): Promise<void> {
    try {
      await this.http.patch(
        `/api/products/${productId}/stock/restore`,
        { quantity },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch {
      // Log but don't throw — a failed stock restore is handled by ops team
      console.error(`[order] Failed to restore stock for product ${productId}`);
    }
  }
}

export const productClient = new ProductClient();
