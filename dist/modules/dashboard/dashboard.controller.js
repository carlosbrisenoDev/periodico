import { articlesCollection } from './dashboard.model.js';
import { authorsCollection } from '../author/author.model.js';
export const getSummary = async (_req, res) => {
    const [draft, published, scheduled, latestArticles] = await Promise.all([
        articlesCollection().countDocuments({ status: 'draft' }),
        articlesCollection().countDocuments({ status: 'published' }),
        articlesCollection().countDocuments({ status: 'scheduled' }),
        articlesCollection()
            .find({}).project({ title: 1, slug: 1, status: 1, createdAt: 1, deletedAt: 1, authorId: 1 })
            .sort({ createdAt: -1 })
            .limit(10)
            .toArray()
    ]);
    const authorIds = [...new Set(latestArticles.map(a => a.authorId).filter(Boolean))];
    const authors = await authorsCollection().find({ _id: { $in: authorIds } }).toArray();
    const authorMap = new Map(authors.map(a => [a._id.toString(), a.name]));
    res.status(200).json({
        counts: { draft, published, scheduled },
        latestArticles: latestArticles.map((article) => ({
            id: article._id.toString(),
            title: article.title,
            slug: article.slug,
            status: article.deletedAt ? 'deleted' : article.status,
            createdAt: article.createdAt,
            authorName: article.authorId ? authorMap.get(article.authorId.toString()) ?? 'Redacción' : 'Redacción'
        }))
    });
};
