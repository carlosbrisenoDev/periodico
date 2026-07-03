import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';
import { articlesCollection } from './dashboard.model.js';
import { auditLogsCollection } from '../audit/index.js';

export const getSummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [draft, published, scheduled, recentAuditLogs] = await Promise.all([
    articlesCollection().countDocuments({ status: 'draft' }),
    articlesCollection().countDocuments({ status: 'published' }),
    articlesCollection().countDocuments({ status: 'scheduled' }),
    auditLogsCollection()
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
  ]);

  res.status(200).json({
    counts: { draft, published, scheduled },
    recentAuditLogs: recentAuditLogs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      entityType: log.entityType,
      userName: log.userName ?? null,
      userEmail: log.userEmail ?? null,
      details: log.details,
      createdAt: log.createdAt
    }))
  });
};
