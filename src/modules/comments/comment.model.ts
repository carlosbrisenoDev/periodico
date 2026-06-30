import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export type CommentDoc = {
  _id: Types.ObjectId;
  articleId: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema<CommentDoc>(
  {
    articleId: { type: Schema.Types.ObjectId, required: true, ref: 'Article', index: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true, lowercase: true },
    content: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true }
  },
  {
    collection: 'comments',
    versionKey: false,
    timestamps: true
  }
);

export const CommentModel = mongoose.models.Comment || mongoose.model<CommentDoc>('Comment', commentSchema);
const commentsCollection = () => createCollectionAdapter<CommentDoc>(CommentModel);

export { commentsCollection };
