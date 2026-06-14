import { z } from 'zod';

const slugify = (str: string) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export const createProductDtoBase = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(200)
    .trim(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000).trim(),
  price: z
    .number({ required_error: 'Price is required' })
    .min(0, 'Price cannot be negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
  compareAtPrice: z.number().min(0).optional(),
  imageUrl:       z.string().url('Image URL must be a valid URL').optional(),
  images:         z.array(z.string().url('Each image must be a valid URL')).default([]),
  thumbnail:      z.string().url('Thumbnail URL must be a valid URL').optional(),
  category:       z.string().min(1, 'Category is required'),
  brand:          z.string().max(100).trim().optional(),
  sku:            z.string().min(1, 'SKU is required').max(100).trim().toUpperCase(),
  stock:          z.number().int().min(0).default(0),
  isFeatured:     z.boolean().default(false),
  tags:           z.array(z.string()).default([]),
  attributes:     z.record(z.string()).default({}),
});

export const createProductDto = createProductDtoBase.transform((data) => ({
  ...data,
  slug: slugify(data.name),  // auto-generate slug from name
}));

export const updateProductDto = createProductDtoBase.partial().omit({ sku: true }).transform((data) => {
  if (data.name) {
    return { ...data, slug: slugify(data.name) };
  }
  return data;
});
// SKU cannot be changed after creation — it's the immutable identifier

export const updateStockDto = z.object({
  quantity: z.coerce.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
});

export const productQueryDto = z.object({
  page:     z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit:    z.string().optional().transform((v) => (v ? Math.min(parseInt(v, 10), 50) : 12)),
  sort:     z.enum([
    'newest', 'price_asc', 'price_desc', 'rating', 'name',
    'price', '-price', 'createdAt', '-createdAt'
  ]).optional().default('newest'),
  category: z.string().optional(),
  search:   z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  inStock:  z.string().optional().transform((v) => v === 'true'),
  featured: z.string().optional().transform((v) => v === 'true'),
});

export const createCategoryDtoBase = z.object({
  name:        z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  image:       z.string().url().optional(),
});

export const createCategoryDto = createCategoryDtoBase.transform((data) => ({
  ...data,
  slug: slugify(data.name),
}));

export const updateCategoryDto = createCategoryDtoBase.partial().transform((data) => {
  if (data.name) {
    return { ...data, slug: slugify(data.name) };
  }
  return data;
});

export type CreateProductDto   = z.infer<typeof createProductDto>;
export type UpdateProductDto   = z.infer<typeof updateProductDto>;
export type UpdateStockDto     = z.infer<typeof updateStockDto>;
export type ProductQueryDto    = z.infer<typeof productQueryDto>;
export type CreateCategoryDto  = z.infer<typeof createCategoryDto>;
export type UpdateCategoryDto  = z.infer<typeof updateCategoryDto>;
