import mongoose, { Schema, Document } from 'mongoose';
import { AIMetadata } from '../types';

export interface IListing extends Document {
  seller: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'physical' | 'digital';
  category: 'book' | 'notes' | 'cheatsheet' | 'calculator' | 'labcoat' | 'other';
  price: number;
  currency: string;
  images: string[];
  fileUrl?: string;
  previewPages: string[];
  tags: string[];
  university: mongoose.Types.ObjectId;
  department: string;
  courseCode: string;
  professor?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair';
  status: 'active' | 'sold' | 'flagged' | 'removed';
  aiMetadata?: AIMetadata;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ['physical', 'digital'], required: true },
    category: {
      type: String,
      enum: ['book', 'notes', 'cheatsheet', 'calculator', 'labcoat', 'other'],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    images: [{ type: String }],
    fileUrl: { type: String },
    previewPages: [{ type: String }],
    tags: [{ type: String, trim: true }],
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    department: { type: String, required: true, trim: true },
    courseCode: { type: String, required: true, trim: true, uppercase: true },
    professor: { type: String, trim: true },
    condition: { type: String, enum: ['new', 'like-new', 'good', 'fair'] },
    status: { type: String, enum: ['active', 'sold', 'flagged', 'removed'], default: 'active' },
    aiMetadata: {
      extractedTitle: String,
      isbn: String,
      edition: String,
      summary: String,
      mcqs: [
        {
          question: String,
          options: [String],
          correctAnswer: Number,
        },
      ],
      tags: [String],
      integrityFlag: Boolean,
      integrityReason: String,
    },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text', tags: 'text', courseCode: 'text' });
listingSchema.index({ university: 1, department: 1, courseCode: 1 });
listingSchema.index({ seller: 1 });
listingSchema.index({ status: 1, type: 1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);
