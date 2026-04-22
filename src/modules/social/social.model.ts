import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'custom';

export type SocialDoc = {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  platform: SocialPlatform;
  url: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
};

const socialSchema = new Schema<SocialDoc>(
  {
    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'Author', index: true },
    platform: { type: String, required: true, enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'custom'], index: true },
    url: { type: String, required: true, trim: true },
    label: { type: String, required: false, trim: true }
  },
  {
    collection: 'socials',
    versionKey: false,
    timestamps: true
  }
);

socialSchema.index({ authorId: 1, platform: 1, url: 1 }, { unique: true });
socialSchema.index({ authorId: 1, createdAt: -1 });

export const SocialModel = mongoose.models.Social || mongoose.model<SocialDoc>('Social', socialSchema);
const socialsCollection = () => createCollectionAdapter<SocialDoc>(SocialModel);

export { socialsCollection };

