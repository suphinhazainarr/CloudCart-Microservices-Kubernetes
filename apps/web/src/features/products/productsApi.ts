import { apiSlice } from '../../app/apiSlice';
import type { ApiResponse, Product, Category, PaginationMeta } from '../../types';

export interface ProductsQuery {
  page?:     number;
  limit?:    number;
  sort?:     string;
  category?: string;
  search?:   string;
  minPrice?: number;
  maxPrice?: number;
  inStock?:  boolean;
  featured?: boolean;
}

interface ProductsResponse {
  products: Product[];
}

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getProducts: builder.query<
      ApiResponse<ProductsResponse> & { meta?: PaginationMeta },
      ProductsQuery
    >({
      query: (params) => ({
        url:    '/products',
        params: { ...params },
      }),
      providesTags: (result) =>
        result?.data?.products
          ? [
              ...result.data.products.map(({ _id }) => ({
                type: 'Products' as const,
                id: _id,
              })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    getProductBySlug: builder.query<ApiResponse<{ product: Product }>, string>({
      query: (slug) => `/products/slug/${slug}`,
      providesTags: (_result, _err, slug) => [{ type: 'Products', id: slug }],
    }),

    getFeaturedProducts: builder.query<ApiResponse<{ products: Product[] }>, void>({
      query: () => '/products/featured',
      providesTags: [{ type: 'Products', id: 'FEATURED' }],
    }),

    getCategories: builder.query<ApiResponse<{ categories: Category[] }>, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    // Admin mutations
    createProduct: builder.mutation<ApiResponse<{ product: Product }>, Partial<Product>>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }, { type: 'Products', id: 'FEATURED' }],
    }),

    updateProduct: builder.mutation<ApiResponse<{ product: Product }>, { id: string } & Partial<Product>>({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Products', id }],
    }),

    deleteProduct: builder.mutation<ApiResponse, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetFeaturedProductsQuery,
  useGetCategoriesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
