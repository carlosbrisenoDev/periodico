import mongoose, { Schema, Types } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export type CitizenReportStatus = 'new' | 'reviewed' | 'resolved';

export type CitizenReportDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  description: string;
  imageUrl?: string;
  status: CitizenReportStatus;
  createdAt: Date;
  updatedAt: Date;
};

const citizenReportSchema = new Schema<CitizenReportDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: false, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new', index: true }
  },
  {
    collection: 'citizen_reports',
    versionKey: false,
    timestamps: true
  }
);

export const CitizenReportModel = mongoose.models.CitizenReport || mongoose.model<CitizenReportDoc>('CitizenReport', citizenReportSchema);
const citizenReportsCollection = () => createCollectionAdapter<CitizenReportDoc>(CitizenReportModel);

export { citizenReportsCollection };
