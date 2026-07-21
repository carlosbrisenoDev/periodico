import mongoose, { Schema } from 'mongoose';
const AnalyticsEventSchema = new Schema({
    type: { type: String, enum: ['view', 'tab', 'navigation', 'time', 'conversion'], required: true },
    url: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    ip: { type: String, required: false },
    timestamp: { type: Date, default: Date.now }
});
export const AnalyticsEventModel = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
