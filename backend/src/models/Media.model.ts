import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  userId: string;
  dateNightId?: string;
  reviewId?: string;
  type: 'image' | 'video';
  url: string;
  filename: string;
  size: number;
  contentType: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    userId: { type: String, required: true, index: true },
    dateNightId: { type: String, index: true },
    reviewId: { type: String, index: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    contentType: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedia>('Media', MediaSchema);

