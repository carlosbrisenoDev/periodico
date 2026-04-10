import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type AuthorDoc = {
  _id: Types.ObjectId;
  name: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

const authorSchema = new Schema<AuthorDoc>(
  {
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: false },
    avatarUrl: { type: String, required: false }
  },
  {
    collection: 'authors',
    versionKey: false,
    timestamps: true
  }
);

export const AuthorModel = mongoose.models.Author || mongoose.model<AuthorDoc>('Author', authorSchema);
const authorsCollection = () => createCollectionAdapter<AuthorDoc>(AuthorModel);

export { authorsCollection };
