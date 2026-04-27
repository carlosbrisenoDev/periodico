import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const authorSchema = new Schema({
    name: { type: String, required: true, trim: true },
    bio: { type: String, required: false },
    avatarUrl: { type: String, required: false },
    userId: { type: Schema.Types.ObjectId, required: false, ref: 'User', default: null, index: true }
}, {
    collection: 'authors',
    versionKey: false,
    timestamps: true
});
export const AuthorModel = mongoose.models.Author || mongoose.model('Author', authorSchema);
const authorsCollection = () => createCollectionAdapter(AuthorModel);
export { authorsCollection };
