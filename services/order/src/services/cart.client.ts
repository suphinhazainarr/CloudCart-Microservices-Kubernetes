import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export interface CartItem {
  productId:  string;
  name:       string;
  price:      number;
  image:      string;
  quantity:   number;
  stock:      number;
  slug:       string;
}

export interface CartData {
  items:      CartItem[];
  total:      number;
  itemCount:  number;
  totalItems: number;
}

class CartClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.CART_SERVICE_URL,
      timeout: 5000,
    });
  }

  // Fetch and validate cart — called before creating order
  async getCartForCheckout(accessToken: string): Promise<CartData> {
    const response = await this.http.get('/api/cart/checkout', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.data.cart;
  }

  // Clear cart after order is successfully created
  async clearCart(accessToken: string): Promise<void> {
    await this.http.delete('/api/cart', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }
}

export const cartClient = new CartClient();
