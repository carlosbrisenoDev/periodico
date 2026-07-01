import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const categorySchema = new Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, required: false },
    order: { type: Number, default: 0 },
    color: { type: String, required: false, trim: true },
    template: { type: String, required: false, trim: true, default: 'default' }
}, {
    collection: 'categories',
    versionKey: false,
    timestamps: true
});
export const CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema);
const categoriesCollection = () => createCollectionAdapter(CategoryModel);
export { categoriesCollection };
