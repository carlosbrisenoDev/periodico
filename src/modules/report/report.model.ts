import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type ReportStatus = 'pending' | 'resolved' | 'ignored';

export type ReportDoc = {
  _id: Types.ObjectId;
  reportedArticleId: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
};

const reportSchema = new Schema<ReportDoc>(
  {
    reportedArticleId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Article',
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'ignored'],
      default: 'pending',
      index: true
    }
  },
  {
    collection: 'reports',
    versionKey: false,
    timestamps: true
  }
);

export const ReportModel = mongoose.models.Report || mongoose.model<ReportDoc>('Report', reportSchema);
const reportsCollection = () => createCollectionAdapter<ReportDoc>(ReportModel);

export { reportsCollection };
