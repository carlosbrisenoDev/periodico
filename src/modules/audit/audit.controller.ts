import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { auditLogsCollection, AuditAction } from './audit.model.js';

export const logAudit = async (
  action: AuditAction,
  entityType: string,
  entityId?: string,
  userId?: string,
  details?: string,
  ipAddress?: string
): Promise<void> => {
  try {
    const now = new Date();
    await auditLogsCollection().insertOne({
      _id: new ObjectId(),
      action,
      entityType,
      entityId,
      userId: userId ? new ObjectId(userId) : undefined,
      details,
      ipAddress,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
};

export const listAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const { action, entityType, userId, page = 1, limit = 20 } = req.query;
  const filter: any = {};
  
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (userId && ObjectId.isValid(userId as string)) filter.userId = new ObjectId(userId as string);

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
