import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export type ListingType = 'physical' | 'digital';
export type ListingCategory = 'book' | 'notes' | 'cheatsheet' | 'calculator' | 'labcoat' | 'other';
export type ListingStatus = 'active' | 'sold' | 'flagged' | 'removed';
export type OrderStatus = 'pending' | 'escrow' | 'completed' | 'disputed' | 'refunded';
export type UserMode = 'buyer' | 'seller';

export interface AIMetadata {
  extractedTitle?: string;
  isbn?: string;
  edition?: string;
  summary?: string;
  mcqs?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  tags?: string[];
  integrityFlag?: boolean;
  integrityReason?: string;
}
