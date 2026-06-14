export type UserRole = 'customer' | 'admin';

export interface User {
  id:        string;
  firstName: string;
  lastName:  string;
  email:     string;
  role:      UserRole;
}

export interface Product {
  id:              string;
  _id:             string;
  name:            string;
  slug:            string;
  description:     string;
  price:           number;
  compareAtPrice?: number;
  images:          string[];
  category:        { _id: string; name: string; slug: string };
  brand?:          string;
  sku:             string;
  stock:           number;
  inStock:         boolean;
  isFeatured:      boolean;
  tags:            string[];
  ratings:         { average: number; count: number };
  discountPercentage: number;
  createdAt:       string;
}

export interface Category {
  _id:          string;
  name:         string;
  slug:         string;
  description?: string;
  image?:       string;
  productCount: number;
}

export interface CartItem {
  productId: string;
  name:      string;
  price:     number;
  image:     string;
  quantity:  number;
  stock:     number;
  slug:      string;
}

export interface Cart {
  items:      CartItem[];
  total:      number;
  itemCount:  number;
  totalItems: number;
}

export interface OrderItem {
  productId:       string;
  name:            string;
  slug:            string;
  image:           string;
  priceAtPurchase: number;
  quantity:        number;
  subtotal:        number;
}

export type OrderStatus =
  | 'pending_payment' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed';

export interface Order {
  _id:            string;
  orderNumber:    string;
  userId:         string;
  items:          OrderItem[];
  shippingAddress: {
    fullName:   string;
    street:     string;
    city:       string;
    state:      string;
    postalCode: string;
    country:    string;
    phone:      string;
  };
  status:          OrderStatus;
  statusHistory:   Array<{ status: OrderStatus; timestamp: string; note?: string }>;
  subtotal:        number;
  shippingCost:    number;
  tax:             number;
  total:           number;
  paymentId?:      string;
  trackingNumber?: string;
  createdAt:       string;
}

export interface Payment {
  _id:           string;
  orderId:       string;
  transactionId: string;
  amount:        number;
  method:        string;
  status:        'pending' | 'success' | 'failed' | 'refunded';
  createdAt:     string;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data:    T | null;
  meta?: {
    page?:       number;
    limit?:      number;
    total?:      number;
    totalPages?: number;
  };
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}
