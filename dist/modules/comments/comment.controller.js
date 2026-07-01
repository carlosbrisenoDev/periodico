import { ObjectId } from 'mongodb';
import { commentsCollection } from './comment.model.js';
import { logAudit } from '../audit/audit.controller.js';
import { settingsCollection } from '../settings/settings.model.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
export const createComment = async (req, res) => {
    const { articleId, authorName, authorEmail, content } = req.body;
    if (!ObjectId.isValid(articleId)) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const settings = await settingsCollection().findOne({ _id: 'global' });
    if (settings && settings.commentBlocklist && settings.commentBlocklist.length > 0) {
        const lowerContent = String(content).toLowerCase();
        const hasBlockedWord = settings.commentBlocklist.some(word => lowerContent.includes(word.toLowerCase()));
        if (hasBlockedWord) {
            res.status(400).json({ message: 'El comentario contiene lenguaje no permitido.' });
            return;
        }
    }
    const now = new Date();
    const result = await commentsCollection().insertOne({
        _id: new ObjectId(),
        articleId: new ObjectId(articleId),
        authorName,
        authorEmail,
        content,
        status: 'pending',
        createdAt: now,
        updatedAt: now
    });
    res.status(201).json({
        id: result.insertedId.toString(),
        articleId,
        authorName,
        authorEmail,
        content,
        status: 'pending'
    });
};
export const listComments = async (req, res) => {
    const { articleId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (articleId && ObjectId.isValid(articleId)) {
        filter.articleId = new ObjectId(articleId);
    }
    if (status) {
        filter.status = status;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const comments = await commentsCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
    const total = await commentsCollection().countDocuments(filter);
    res.status(200).json({
        data: comments.map(c => ({
            id: c._id.toString(),
            articleId: c.articleId.toString(),
            authorName: c.authorName,
            authorEmail: c.authorEmail,
            content: c.content,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        })),
        meta: {
            total,
            page: Number(page),
            limit: Number(limit)
        }
    });
};
export const updateCommentStatus = async (req, res) => {
    const id = readParam(req.params.id);
    const { status } = req.body;
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid comment id' });
        return;
    }
    const result = await commentsCollection().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, { returnDocument: 'after' });
    if (!result) {
        res.status(404).json({ message: 'Comment not found' });
        return;
    }
    res.status(200).json({
        id: result._id.toString(),
        articleId: result.articleId.toString(),
        authorName: result.authorName,
        authorEmail: result.authorEmail,
        content: result.content,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    });
    const authReqUpd = req;
    void logAudit('update', 'comment', result._id.toString(), authReqUpd.user?.userId, `Status changed to "${status}"`, { userName: authReqUpd.user?.name, userEmail: authReqUpd.user?.email, ipAddress: req.ip });
};
export const deleteComment = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid comment id' });
        return;
    }
    const result = await commentsCollection().deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
        res.status(404).json({ message: 'Comment not found' });
        return;
    }
    res.status(200).json({ message: 'Comment deleted' });
    const authReqDel = req;
    void logAudit('delete', 'comment', id, authReqDel.user?.userId, `Deleted comment`, { userName: authReqDel.user?.name, userEmail: authReqDel.user?.email, ipAddress: req.ip });
};
