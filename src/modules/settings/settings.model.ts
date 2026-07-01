import mongoose, { Schema, Model } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';

export interface GlobalSettings {
  _id: string; // "global"
  adsenseEnabled: boolean;
  adsenseClientId: string;
  commentBlocklist: string[];
  updatedAt: Date;
}

const settingsSchema = new Schema<GlobalSettings>(
  {
    _id: { type: String, required: true },
    adsenseEnabled: { type: Boolean, default: false },
    adsenseClientId: { type: String, default: '' },
    commentBlocklist: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'settings' }
);

export const SettingsModel: Model<GlobalSettings> = mongoose.model<GlobalSettings>('Settings', settingsSchema);
export const settingsCollection = () => createCollectionAdapter<GlobalSettings>(SettingsModel);
