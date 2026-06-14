import mongoose, { Document, Schema } from 'mongoose';

// Represents a single item in the cart
export interface ICartItem {
  productId:   string;
  name:        string;
  price:       number;       // price captured AT THE TIME it was added to cart
  image:       string;
  quantity:    number;
  stock:       number;       // current stock — for out-of-stock detection
  slug:        string;
}

// The full cart document — written to MongoDB when an order is placed
export interface ICartSnapshot extends Document {
  userId:    string;
  items:     ICartItem[];
  total:     number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    image:     { type: String, default: '' },
    quantity:  { type: Number, required: true, min: 1 },
    stock:     { type: Number, required: true },
    slug:      { type: String, required: true },
  },
  { _id: false } // no _id on subdocuments — keeps the structure lean
);

const cartSnapshotSchema = new Schema<ICartSnapshot>(
  {
    userId:    { type: String, required: true, unique: true },
    items:     [cartItemSchema],
    total:     { type: Number, default: 0 },
    itemCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSnapshotSchema.index({ userId: 1 });

export const CartSnapshot = mongoose.model<ICartSnapshot>('CartSnapshot', cartSnapshotSchema);
