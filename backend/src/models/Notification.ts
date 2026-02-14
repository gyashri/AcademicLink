import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'order' | 'message' | 'dispute' | 'system' | 'review';
  title: string;
  body: string;
  relatedId?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['order', 'message', 'dispute', 'system', 'review'], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    relatedId: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
