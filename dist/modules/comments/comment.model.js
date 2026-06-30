import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const commentSchema = new Schema({
    articleId: { type: Schema.Types.ObjectId, required: true, ref: 'Article', index: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
}, {
    collection: 'comments',
    versionKey: false,
    timestamps: true
});
export const CommentModel = mongoose.models.Comment || mongoose.model('Comment', commentSchema);
const commentsCollection = () => createCollectionAdapter(CommentModel);
export { commentsCollection };
