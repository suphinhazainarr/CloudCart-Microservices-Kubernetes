import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { NotFoundError, ValidationError } from '@cloudcart/shared';

// The shape of product data the cart cares about
export interface ProductSnapshot {
  id:    string;
  name:  string;
  price: number;
  image: string;
  stock: number;
  slug:  string;
  isActive: boolean;
}

class ProductClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: env.PRODUCT_SERVICE_URL,
      timeout: 5000, // 5 second timeout — never wait forever for another service
      headers: { 'Content-Type': 'application/json' },
    });

    // Log inter-service calls in development
    if (env.NODE_ENV === 'development') {
      this.http.interceptors.request.use((config) => {
        console.warn(`[cart→product] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      });
    }
  }

  async getProduct(productId: string): Promise<ProductSnapshot> {
    try {
      const response = await this.http.get(`/api/products/${productId}`);
      const product = response.data.data.product;

      if (!product.isActive) {
        throw new ValidationError('This product is no longer available');
      }

      return {
        id:       product._id ?? product.id,
        name:     product.name,
        price:    product.price,
        image:    product.images?.[0] ?? '',
        stock:    product.stock,
        slug:     product.slug,
        isActive: product.isActive,
      };
    } catch (error: any) {
      if (error instanceof ValidationError) throw error;
      if (error.response?.status === 404) {
        throw new NotFoundError('Product');
      }
      // Inter-service failure — surface a clear error
      throw new ValidationError(
        'Unable to verify product details. Please try again.'
      );
    }
  }
}

export const productClient = new ProductClient();
