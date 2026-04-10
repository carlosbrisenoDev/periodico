import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/validateToken.js';
import { articlesCollection } from './dashboard.model.js';

export const getSummary = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [draft, published, scheduled, latestArticles] = await Promise.all([
    articlesCollection().countDocuments({ status: 'draft' }),
    articlesCollection().countDocuments({ status: 'published' }),
    articlesCollection().countDocuments({ status: 'scheduled' }),
    articlesCollection()
      .find({})
      .project({ title: 1, slug: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()
  ]);

  res.status(200).json({
    counts: { draft, published, scheduled },
    latestArticles: latestArticles.map((article) => ({
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      status: article.status,
      createdAt: article.createdAt
    }))
  });
};
