import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus  = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod  = 'credit_card' | 'debit_card' | 'upi' | 'net_banking';

export interface IPayment extends Document {
  orderId:         string;
  userId:          string;
  transactionId:   string;        // unique ID returned by the "gateway"
  amount:          number;
  currency:        string;
  method:          PaymentMethod;
  status:          PaymentStatus;
  gatewayResponse: Record<string, unknown>;  // raw simulated gateway response
  failureReason?:  string;
  refundedAt?:     Date;
  createdAt:       Date;
  updatedAt:       Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type:     String,
      required: true,
      index:    true,
    },
    userId: {
      type:     String,
      required: true,
    },
    transactionId: {
      type:     String,
      required: true,
      unique:   true,
    },
    amount:   { type: Number,  required: true },
    currency: { type: String,  default: 'USD' },
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'net_banking'],
      required: true,
    },
    status: {
      type:    String,
      enum:    ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    gatewayResponse: { type: Schema.Types.Mixed, default: {} },
    failureReason:   { type: String },
    refundedAt:      { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => { delete ret.__v; return ret; },
    },
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
