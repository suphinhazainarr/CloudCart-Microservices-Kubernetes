import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@cloudcart/shared';

// Interface for TypeScript — defines what a User document looks like
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash: string | null;   // stores the HASH of the refresh token, never the raw token
  isActive: boolean;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

export interface IAddress {
  label: string;        // "Home", "Work", etc.
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>(
  {
    label:      { type: String, default: 'Home' },
    street:     { type: String, required: true },
    city:       { type: String, required: true },
    state:      { type: String, required: true },
    postalCode: { type: String, required: true },
    country:    { type: String, required: true },
    isDefault:  { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,         // creates a MongoDB unique index automatically
      lowercase: true,      // normalise before storing
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,        // NEVER returned in queries by default — must opt in with .select('+passwordHash')
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,        // same as passwordHash — never leaked accidentally
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,       // adds createdAt and updatedAt automatically
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        delete ret.passwordHash;       // belt-and-suspenders: strip even if select: false is bypassed
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// email already has a unique index from `unique: true` above.
// Add a compound index for queries that filter by role + isActive (admin dashboard).
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdAt: -1 });   // for sorting users by newest in admin

// ─── Virtual ────────────────────────────────────────────────────────────────
userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Instance methods ────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.getFullName = function (this: IUser): string {
  return `${this.firstName} ${this.lastName}`;
};

export const User = mongoose.model<IUser>('User', userSchema);
