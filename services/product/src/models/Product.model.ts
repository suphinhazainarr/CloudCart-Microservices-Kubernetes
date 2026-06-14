import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name:        string;
  slug:        string;
  description: string;
  price:       number;
  compareAtPrice?: number;   // original price for "was $X, now $Y" display
  imageUrl?:   string;
  images:      string[];
  thumbnail?:  string;
  category:    mongoose.Types.ObjectId;
  brand?:      string;
  sku:         string;
  stock:       number;
  isActive:    boolean;
  isFeatured:  boolean;
  tags:        string[];
  attributes:  Record<string, string>; // flexible: { color: 'red', size: 'M' }
  ratings: {
    average: number;
    count:   number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    description: {
      type:     String,
      required: [true, 'Product description is required'],
      trim:     true,
      maxlength:[5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type:    Number,
      required:[true, 'Price is required'],
      min:     [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min:  [0, 'Compare price cannot be negative'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    images: {
      type:    [String],
      default: [],
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    category: {
      type:     Schema.Types.ObjectId,
      ref:      'Category',
      required: [true, 'Category is required'],
    },
    brand:    { type: String, trim: true },
    sku: {
      type:     String,
      required: [true, 'SKU is required'],
      unique:   true,
      trim:     true,
      uppercase:true,
    },
    stock: {
      type:    Number,
      required:true,
      min:     [0, 'Stock cannot be negative'],
      default: 0,
    },
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags:       { type: [String], default: [] },
    attributes: { type: Map, of: String, default: {} },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => { delete ret.__v; return ret; },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Text index for full-text search across name, description, brand, tags
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 } }
  // name matches are 10x more relevant than description matches
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ stock: 1 });

// ─── Virtual ──────────────────────────────────────────────────────────────────

productSchema.virtual('inStock').get(function (this: IProduct) {
  return this.stock > 0;
});

productSchema.virtual('discountPercentage').get(function (this: IProduct) {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
