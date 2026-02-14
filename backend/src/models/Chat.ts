import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  text: string;
  read: boolean;
  createdAt: Date;
}

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  listing: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const chatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    messages: [messageSchema],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ listing: 1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
