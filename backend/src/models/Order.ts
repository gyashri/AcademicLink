import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  currency: string;
  status: 'pending' | 'escrow' | 'completed' | 'disputed' | 'refunded';
  paymentIntentId?: string;
  meetupDetails?: {
    location: string;
    dateTime: Date;
    notes: string;
  };
  downloadConfirmed: boolean;
  disputeReason?: string;
  disputeDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    amount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    sellerPayout: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'escrow', 'completed', 'disputed', 'refunded'],
      default: 'pending',
    },
    paymentIntentId: { type: String },
    meetupDetails: {
      location: { type: String },
      dateTime: { type: Date },
      notes: { type: String },
    },
    downloadConfirmed: { type: Boolean, default: false },
    disputeReason: { type: String },
    disputeDeadline: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1 });
orderSchema.index({ seller: 1 });
orderSchema.index({ status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
