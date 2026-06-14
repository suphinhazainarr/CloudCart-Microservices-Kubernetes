import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'payment_failed';

export interface IOrderItem {
  productId:        string;
  name:             string;
  slug:             string;
  image:            string;
  priceAtPurchase:  number;   // locked price — never changes even if product price does
  quantity:         number;
  subtotal:         number;   // priceAtPurchase * quantity
}

export interface IShippingAddress {
  fullName:   string;
  street:     string;
  city:       string;
  state:      string;
  postalCode: string;
  country:    string;
  phone:      string;
}

export interface IStatusHistoryEntry {
  status:    OrderStatus;
  timestamp: Date;
  note?:     string;
}

export interface IOrder extends Document {
  orderNumber:     string;           // human-readable: CC-2024-000123
  userId:          string;
  items:           IOrderItem[];
  shippingAddress: IShippingAddress;
  status:          OrderStatus;
  statusHistory:   IStatusHistoryEntry[];
  subtotal:        number;
  shippingCost:    number;
  tax:             number;
  total:           number;
  paymentId?:      string;
  trackingNumber?: string;
  notes?:          string;
  createdAt:       Date;
  updatedAt:       Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId:       { type: String, required: true },
    name:            { type: String, required: true },
    slug:            { type: String, required: true },
    image:           { type: String, default: '' },
    priceAtPurchase: { type: Number, required: true },
    quantity:        { type: Number, required: true, min: 1 },
    subtotal:        { type: Number, required: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName:   { type: String, required: true },
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    postalCode: { type: String, required: true },
    country:    { type: String, required: true },
    phone:      { type: String, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status:    { type: String, required: true },
    timestamp: { type: Date,   default: Date.now },
    note:      { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type:     String,
      required: true,
      unique:   true,
    },
    userId: {
      type:     String,
      required: true,
      index:    true,
    },
    items:           { type: [orderItemSchema],   required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: {
      type:    String,
      enum:    ['pending_payment','confirmed','processing','shipped','delivered','cancelled','payment_failed'],
      default: 'pending_payment',
    },
    // Full audit trail — every status change is recorded with timestamp
    statusHistory: { type: [statusHistorySchema], default: [] },
    subtotal:      { type: Number, required: true },
    shippingCost:  { type: Number, default: 0 },
    tax:           { type: Number, default: 0 },
    total:         { type: Number, required: true },
    paymentId:     { type: String },
    trackingNumber:{ type: String },
    notes:         { type: String },
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
orderSchema.index({ userId: 1, createdAt: -1 });   // user order history, newest first
orderSchema.index({ status: 1, createdAt: -1 });   // admin dashboard filtering by status
orderSchema.index({ orderNumber: 1 });              // order lookup by number

// ─── Static method to generate order numbers ──────────────────────────────────
orderSchema.statics.generateOrderNumber = async function (): Promise<string> {
  const year  = new Date().getFullYear();
  const count = await this.countDocuments();
  // CC-2024-000001 format — sortable and human-readable
  return `CC-${year}-${String(count + 1).padStart(6, '0')}`;
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);
