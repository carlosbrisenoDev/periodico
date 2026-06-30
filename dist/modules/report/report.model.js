import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const reportSchema = new Schema({
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
}, {
    collection: 'reports',
    versionKey: false,
    timestamps: true
});
export const ReportModel = mongoose.models.Report || mongoose.model('Report', reportSchema);
const reportsCollection = () => createCollectionAdapter(ReportModel);
export { reportsCollection };
