import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  type: 'view' | 'tab' | 'navigation' | 'time' | 'conversion';
  url: string;
  metadata?: any;
  userId?: string;
  ip?: string;
  timestamp: Date;
}

const AnalyticsEventSchema: Schema = new Schema({
  type: { type: String, enum: ['view', 'tab', 'navigation', 'time', 'conversion'], required: true },
  url: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  ip: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

export const AnalyticsEventModel = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
