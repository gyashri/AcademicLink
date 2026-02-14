import mongoose, { Schema, Document } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  domain: string;
  departments: string[];
  createdAt: Date;
}

const universitySchema = new Schema<IUniversity>(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    departments: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export const University = mongoose.model<IUniversity>('University', universitySchema);
