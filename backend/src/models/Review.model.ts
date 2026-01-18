import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  dateNightId: string;
  userId: string;
  userName?: string;
  rating: number;
  message: string;
  emoji?: string;
  images?: string[]; // URLs
  videos?: string[]; // URLs
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    dateNightId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true },
    emoji: String,
    images: [String],
    videos: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IReview>('Review', ReviewSchema);

