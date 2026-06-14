import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type:      String,
      required:  [true, 'Category name is required'],
      unique:    true,
      trim:      true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
      // slug is generated from name — "Electronics & Gadgets" → "electronics-gadgets"
    },
    description: { type: String, trim: true, maxlength: 500 },
    image:       { type: String },
    isActive:    { type: Boolean, default: true },
    productCount:{ type: Number, default: 0 },  // denormalised count for display performance
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => { delete ret.__v; return ret; },
    },
  }
);

categorySchema.index({ isActive: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
