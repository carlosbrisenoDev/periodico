import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type VideoDoc = {
  _id: Types.ObjectId;
  url: string;
  platform: 'youtube' | 'twitter' | 'other';
  videoExternalId: string;
  title?: string;
  addedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const videoSchema = new Schema<VideoDoc>(
  {
    url: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'twitter', 'other'], required: true },
    videoExternalId: { type: String, required: true },
    title: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'Author' }
  },
  {
    collection: 'videos',
    versionKey: false,
    timestamps: true
  }
);

export const VideoModel = mongoose.models.Video || mongoose.model<VideoDoc>('Video', videoSchema);
export const videosCollection = () => createCollectionAdapter<VideoDoc>(VideoModel);
