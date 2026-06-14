import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export interface OrderData {
  _id:    string;
  userId: string;
  status: string;
  total:  number;
}

class OrderClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.ORDER_SERVICE_URL,
      timeout: 5000,
    });
  }

  async getOrder(orderId: string, accessToken: string): Promise<OrderData> {
    const response = await this.http.get(`/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.data.order;
  }

  async updatePaymentResult(
    orderId:     string,
    paymentId:   string,
    status:      'confirmed' | 'payment_failed',
    accessToken: string
  ): Promise<void> {
    await this.http.patch(
      `/api/orders/${orderId}/payment`,
      { paymentId, status },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

export const orderClient = new OrderClient();
