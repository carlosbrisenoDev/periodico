import { ObjectId } from 'mongodb';
import { auditLogsCollection } from './audit.model.js';
export const logAudit = async (action, entityType, entityId, userId, details, options) => {
    try {
        const now = new Date();
        await auditLogsCollection().insertOne({
            _id: new ObjectId(),
            action,
            entityType,
            entityId,
            userId: userId && ObjectId.isValid(userId) ? new ObjectId(userId) : undefined,
            userName: options?.userName,
            userEmail: options?.userEmail,
            details,
            ipAddress: options?.ipAddress,
            createdAt: now,
            updatedAt: now
        });
    }
    catch (error) {
        // Audit failures should never break the main operation
        console.error('Failed to write audit log', error);
    }
};
export const listAuditLogs = async (req, res) => {
    const { action, entityType, userId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action)
        filter.action = action;
    if (entityType)
        filter.entityType = entityType;
    if (userId && ObjectId.isValid(userId))
        filter.userId = new ObjectId(userId);
    const skip = (Number(page) - 1) * Number(limit);
    const logs = await auditLogsCollection()
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray();
    const total = await auditLogsCollection().countDocuments(filter);
    res.status(200).json({
        data: logs.map(l => ({
            id: l._id.toString(),
            action: l.action,
            entityType: l.entityType,
            entityId: l.entityId,
            userId: l.userId?.toString(),
            userName: l.userName ?? null,
            userEmail: l.userEmail ?? null,
            details: l.details,
            ipAddress: l.ipAddress,
            createdAt: l.createdAt
        })),
        meta: {
            total,
            page: Number(page),
            limit: Number(limit)
        }
    });
};
