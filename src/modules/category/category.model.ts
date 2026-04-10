import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type CategoryDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, required: false }
  },
  {
    collection: 'categories',
    versionKey: false,
    timestamps: true
  }
);

export const CategoryModel = mongoose.models.Category || mongoose.model<CategoryDoc>('Category', categorySchema);
const categoriesCollection = () => createCollectionAdapter<CategoryDoc>(CategoryModel);

export { categoriesCollection };
