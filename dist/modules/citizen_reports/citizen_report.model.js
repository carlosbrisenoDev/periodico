import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const citizenReportSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: false, trim: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new', index: true }
}, {
    collection: 'citizen_reports',
    versionKey: false,
    timestamps: true
});
export const CitizenReportModel = mongoose.models.CitizenReport || mongoose.model('CitizenReport', citizenReportSchema);
const citizenReportsCollection = () => createCollectionAdapter(CitizenReportModel);
export { citizenReportsCollection };
