import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type CategoryDoc = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  order: number;
  color?: string;
  template?: string;
  createdAt: Date;
  updatedAt: Date;
};

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, required: false },
    order: { type: Number, default: 0 },
    color: { type: String, required: false, trim: true },
    template: { type: String, required: false, trim: true, default: 'default' }
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
