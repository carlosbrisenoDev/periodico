import { AnalyticsEventModel } from './analytics.model.js';
export const logView = async (req, res) => {
    try {
        const { url } = req.body;
        const userId = req.user?.id || req.body.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const event = new AnalyticsEventModel({
            type: 'view',
            url: url || '/',
            userId: userId ? userId : undefined,
            ip: ip ? String(ip) : undefined
        });
        await event.save();
        res.status(201).json({ message: 'View logged' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const logTab = async (req, res) => {
    try {
        const { url, tabName } = req.body;
        const userId = req.user?.id || req.body.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const event = new AnalyticsEventModel({
            type: 'tab',
            url: url || '/',
            metadata: { tabName },
            userId: userId ? userId : undefined,
            ip: ip ? String(ip) : undefined
        });
        await event.save();
        res.status(201).json({ message: 'Tab logged' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const logNavigation = async (req, res) => {
    try {
        const { from, to } = req.body;
        const userId = req.user?.id || req.body.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const event = new AnalyticsEventModel({
            type: 'navigation',
            url: to || '/',
            metadata: { from, to },
            userId: userId ? userId : undefined,
            ip: ip ? String(ip) : undefined
        });
        await event.save();
        res.status(201).json({ message: 'Navigation logged' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const logTime = async (req, res) => {
    try {
        const { url, timeSpent } = req.body;
        const userId = req.user?.id || req.body.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const event = new AnalyticsEventModel({
            type: 'time',
            url: url || '/',
            metadata: { timeSpent },
            userId: userId ? userId : undefined,
            ip: ip ? String(ip) : undefined
        });
        await event.save();
        res.status(201).json({ message: 'Time logged' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const logConversion = async (req, res) => {
    try {
        const { url, conversionType } = req.body;
        const userId = req.user?.id || req.body.userId;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const event = new AnalyticsEventModel({
            type: 'conversion',
            url: url || '/',
            metadata: { conversionType },
            userId: userId ? userId : undefined,
            ip: ip ? String(ip) : undefined
        });
        await event.save();
        res.status(201).json({ message: 'Conversion logged' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getLogs = async (req, res) => {
    try {
        const type = req.query.type;
        const limit = Number(req.query.limit) || 1000;
        const skip = Number(req.query.skip) || 0;
        const filter = {};
        if (type) {
            filter.type = type;
        }
        const logs = await AnalyticsEventModel.find(filter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email');
        res.status(200).json({ data: logs });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
