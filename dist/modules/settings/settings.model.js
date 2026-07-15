import mongoose, { Schema } from 'mongoose';
import { createCollectionAdapter } from '../../libs/mongoose-adapter.js';
const settingsSchema = new Schema({
    _id: { type: String, required: true },
    adsenseEnabled: { type: Boolean, default: false },
    adsenseClientId: { type: String, default: '' },
    commentBlocklist: { type: [String], default: [] },
    printEditionImageUrl: { type: String, default: '' },
    printEditionLink: { type: String, default: '' },
    themeColors: {
        background: { type: String, default: '#ffffff' },
        foreground: { type: String, default: '#20242b' },
        navbarBg: { type: String, default: '#ffffff' },
        primaryColor: { type: String, default: '#2563eb' },
        footerBg: { type: String, default: '#111827' },
        footerText: { type: String, default: '#f9fafb' },
        liveBarBg: { type: String, default: '#dc2626' },
        liveBarText: { type: String, default: '#ffffff' },
        mutedText: { type: String, default: '#6f7280' },
        surface: { type: String, default: '#ffffff' },
        border: { type: String, default: '#e2e3e6' },
        cardBorder: { type: String, default: '#c32f27' }
    },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'settings' });
export const SettingsModel = mongoose.model('Settings', settingsSchema);
export const settingsCollection = () => createCollectionAdapter(SettingsModel);
