export type UserRole = 'customer' | 'admin';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductFilters extends PaginationQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}
