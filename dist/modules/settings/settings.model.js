import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const settingsSchema = new Schema({
    _id: { type: String, required: true },
    adsenseEnabled: { type: Boolean, default: false },
    adsenseClientId: { type: String, default: '' },
    commentBlocklist: { type: [String], default: [] },
    printEditionImageUrl: { type: String, default: '' },
    printEditionLink: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'settings' });
export const SettingsModel = mongoose.model('Settings', settingsSchema);
export const settingsCollection = () => createCollectionAdapter(SettingsModel);
