import { ObjectId } from 'mongodb';
import { reportsCollection } from './report.model.js';
import { articlesCollection } from '../article/article.model.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
export const createReport = async (req, res) => {
    const { reportedArticleId, reason } = req.body;
    if (!ObjectId.isValid(reportedArticleId)) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const article = await articlesCollection().findOne({ _id: new ObjectId(reportedArticleId) });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const now = new Date();
    const result = await reportsCollection().insertOne({
        _id: new ObjectId(),
        reportedArticleId: new ObjectId(reportedArticleId),
        reason,
        status: 'pending',
        createdAt: now,
        updatedAt: now
    });
    res.status(201).json({
        id: result.insertedId.toString(),
        reportedArticleId,
        reason,
        status: 'pending'
    });
};
export const listReports = async (req, res) => {
    const queryStatus = readParam(req.query.status);
    const queryPage = readParam(req.query.page);
    const queryLimit = readParam(req.query.limit);
    const filters = {};
    if (queryStatus) {
        filters.status = queryStatus;
    }
    const hasPage = queryPage !== '';
    const hasLimit = queryLimit !== '';
    const page = hasPage ? Number(queryPage) : 1;
    const requestedLimit = hasLimit ? Number(queryLimit) : 20;
    const total = await reportsCollection().countDocuments(filters);
    const limit = hasPage || hasLimit ? requestedLimit : total || 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const reports = await reportsCollection()
        .find(filters)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
    res.status(200).json({
        items: reports.map((report) => ({
            id: report._id.toString(),
            reportedArticleId: report.reportedArticleId.toString(),
            reason: report.reason,
            status: report.status,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        })),
        page,
        limit,
        total,
        totalPages
    });
};
export const updateReportStatus = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid report id' });
        return;
    }
    const { status } = req.body;
    const result = await reportsCollection().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!result) {
        res.status(404).json({ message: 'Report not found' });
        return;
    }
    res.status(200).json({
        id: result._id.toString(),
        reportedArticleId: result.reportedArticleId.toString(),
        reason: result.reason,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    });
};
