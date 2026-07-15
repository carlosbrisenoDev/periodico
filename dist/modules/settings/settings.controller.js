import { settingsCollection } from './settings.model.js';
import { logAudit } from '../audit/index.js';
const DEFAULT_SETTINGS = {
    _id: 'global',
    adsenseEnabled: false,
    adsenseClientId: '',
    commentBlocklist: [],
    printEditionImageUrl: '',
    printEditionLink: '',
    themeColors: {
        background: '#ffffff',
        foreground: '#20242b',
        navbarBg: '#ffffff',
        primaryColor: '#2563eb',
        footerBg: '#111827',
        footerText: '#f9fafb',
        liveBarBg: '#dc2626',
        liveBarText: '#ffffff',
        mutedText: '#6f7280',
        surface: '#ffffff',
        border: '#e2e3e6',
        cardBorder: 'transparent'
    },
    updatedAt: new Date()
};
export const getSettings = async (req, res) => {
    try {
        const settings = await settingsCollection().findOne({ _id: 'global' });
        if (!settings) {
            res.status(200).json(DEFAULT_SETTINGS);
            return;
        }
        res.status(200).json(settings);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};
export const updateSettings = async (req, res) => {
    try {
        const { adsenseEnabled, adsenseClientId, commentBlocklist, printEditionImageUrl, printEditionLink, themeColors } = req.body;
        // Validations can be done via schema, but we will ensure valid data structure here
        const updateData = {
            updatedAt: new Date()
        };
        if (typeof adsenseEnabled === 'boolean')
            updateData.adsenseEnabled = adsenseEnabled;
        if (typeof adsenseClientId === 'string')
            updateData.adsenseClientId = adsenseClientId;
        if (Array.isArray(commentBlocklist))
            updateData.commentBlocklist = commentBlocklist.map(s => String(s).trim()).filter(Boolean);
        if (typeof printEditionImageUrl === 'string')
            updateData.printEditionImageUrl = printEditionImageUrl;
        if (typeof printEditionLink === 'string')
            updateData.printEditionLink = printEditionLink;
        if (themeColors && typeof themeColors === 'object') {
            updateData.themeColors = {
                background: String(themeColors.background || '#ffffff'),
                foreground: String(themeColors.foreground || '#20242b'),
                navbarBg: String(themeColors.navbarBg || '#ffffff'),
                primaryColor: String(themeColors.primaryColor || '#2563eb'),
                footerBg: String(themeColors.footerBg || '#111827'),
                footerText: String(themeColors.footerText || '#f9fafb'),
                liveBarBg: String(themeColors.liveBarBg || '#dc2626'),
                liveBarText: String(themeColors.liveBarText || '#ffffff'),
                mutedText: String(themeColors.mutedText || '#6f7280'),
                surface: String(themeColors.surface || '#ffffff'),
                border: String(themeColors.border || '#e2e3e6'),
                cardBorder: String(themeColors.cardBorder || 'transparent')
            };
        }
        const result = await settingsCollection().findOneAndUpdate({ _id: 'global' }, { $set: updateData }, { upsert: true, returnDocument: 'after' });
        if (req.user) {
            await logAudit('update', 'Settings', 'global', req.user.userId, JSON.stringify(updateData), {
                userName: req.user.email,
                userEmail: req.user.email
            });
        }
        res.status(200).json(result || { ...DEFAULT_SETTINGS, ...updateData });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};
export const getPublicSettings = async (req, res) => {
    try {
        const settings = await settingsCollection().findOne({ _id: 'global' });
        if (!settings) {
            res.status(200).json({
                adsenseEnabled: DEFAULT_SETTINGS.adsenseEnabled,
                adsenseClientId: DEFAULT_SETTINGS.adsenseClientId,
                printEditionImageUrl: DEFAULT_SETTINGS.printEditionImageUrl,
                printEditionLink: DEFAULT_SETTINGS.printEditionLink,
                themeColors: DEFAULT_SETTINGS.themeColors
            });
            return;
        }
        res.status(200).json({
            adsenseEnabled: settings.adsenseEnabled,
            adsenseClientId: settings.adsenseClientId,
            printEditionImageUrl: settings.printEditionImageUrl,
            printEditionLink: settings.printEditionLink,
            themeColors: settings.themeColors || DEFAULT_SETTINGS.themeColors
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching public settings' });
    }
};
