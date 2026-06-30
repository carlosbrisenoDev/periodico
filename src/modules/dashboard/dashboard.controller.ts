import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';
import { articlesCollection } from './dashboard.model.js';
import { authorsCollection } from '../author/author.model.js';
import { auditLogsCollection } from '../audit/audit.model.js';

export const getSummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [draft, published, scheduled, latestArticles, recentAuditLogs] = await Promise.all([
    articlesCollection().countDocuments({ status: 'draft' }),
    articlesCollection().countDocuments({ status: 'published' }),
    articlesCollection().countDocuments({ status: 'scheduled' }),
    articlesCollection()
      .find({}).project({ title: 1, slug: 1, status: 1, createdAt: 1, deletedAt: 1, authorId: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
    auditLogsCollection()
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
  ]);

  const authorIds = [...new Set(latestArticles.map((a: any) => a.authorId).filter(Boolean))];
  const authors = await authorsCollection().find({ _id: { $in: authorIds } }).toArray();
  const authorMap = new Map(authors.map((a: any) => [a._id.toString(), a.name]));

  res.status(200).json({
    counts: { draft, published, scheduled },
    latestArticles: latestArticles.map((article: any) => ({
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      status: article.deletedAt ? 'deleted' : article.status,
      createdAt: article.createdAt,
      authorName: article.authorId ? authorMap.get(article.authorId.toString()) ?? 'Redacción' : 'Redacción'
    })),
    recentAuditLogs: recentAuditLogs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      targetType: log.targetType,
      actorEmail: log.actorEmail,
      details: log.details,
      createdAt: log.createdAt
    }))
  });
};
