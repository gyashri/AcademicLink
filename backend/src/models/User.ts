import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  university: mongoose.Types.ObjectId;
  activeMode: 'buyer' | 'seller';
  stripeAccountId?: string;
  stripeOnboarded: boolean;
  avatar?: string;
  verified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    activeMode: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
    stripeAccountId: { type: String },
    stripeOnboarded: { type: Boolean, default: false },
    avatar: { type: String },
    verified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
