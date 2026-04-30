import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import {
  isPublishableFilter,
  publicArticlesCollection,
  publicAuthorsCollection,
  publicCategoriesCollection,
  serializeObjectId
} from './public.model.js';
import { env } from '../../config.js';
import { verifyAuthToken } from '../../libs/jwt.js';
import { id } from 'zod/locales';

const PUBLIC_API_BASE_PATH = '/api/v1/public';
const FEATURED_HERO_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const resolveFeaturedType = (article: { isFeatured: boolean; featuredType?: string | null }): 'none' | 'hero' | 'headline' | 'breaking' => {
  if (
    article.featuredType === 'hero' ||
    article.featuredType === 'headline' ||
    article.featuredType === 'breaking' ||
    article.featuredType === 'none'
  ) {
    return article.featuredType;
  }

  return article.isFeatured ? 'hero' : 'none';
};

/**
 * Ensures that articles whose scheduled time has passed are marked as 'published'.
 * This is called on-demand when public endpoints are requested.
 */
const syncScheduledArticles = async (): Promise<void> => {
  const now = new Date();

  // Find articles that are scheduled and their time has passed
  const filter = {
    status: 'scheduled',
    scheduledAt: { $lte: now },
    deletedAt: null
  };

  // We perform an updateMany to transition them
  // We set status to 'published', set publishedAt to the scheduledAt value (or now if missing)
  // and clear the scheduledAt field.
  await publicArticlesCollection().updateMany(filter, [
    {
      $set: {
        publishedAt: { $ifNull: ['$scheduledAt', now] },
        status: 'published',
        scheduledAt: null
      }
    }
  ]);
};


const isActiveFeaturedArticle = (article: {
  isFeatured: boolean;
  featuredType?: string | null;
  featuredAt?: Date | null;
  updatedAt: Date;
  createdAt: Date;
}): boolean => {
  const featuredType = resolveFeaturedType(article);

  if (featuredType === 'none') {
    return false;
  }

  if (featuredType !== 'hero') {
    return true;
  }

  const startedAt = article.featuredAt ?? article.updatedAt ?? article.createdAt;
  return Date.now() - startedAt.getTime() < FEATURED_HERO_MAX_AGE_MS;
};

const toPublicArticle = async (article: {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string | null;
  isFeatured: boolean;
  featuredType?: string | null;
  featuredAt?: Date | null;
  authorId: ObjectId;
  categoryIds: ObjectId[];
  publishedAt: Date | null;
  scheduledAt: Date | null;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}): Promise<Record<string, unknown>> => {
  const [author, categories] = await Promise.all([
    publicAuthorsCollection().findOne({ _id: article.authorId }),
    publicCategoriesCollection()
      .find({ _id: { $in: article.categoryIds } })
      .project({ name: 1, slug: 1 })
      .toArray()
  ]);

  const activeFeatured = isActiveFeaturedArticle(article);

  return {
    id: article._id.toString(),
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featuredImageUrl,
    isFeatured: activeFeatured,
    featuredType: activeFeatured ? resolveFeaturedType(article) : 'none',
    featuredAt: activeFeatured ? article.featuredAt : null,
    author: author
      ? {
        id: serializeObjectId(author._id),
        name: author.name,
        bio: author.bio ?? null,
        avatarUrl: author.avatarUrl ?? null
      }
      : null,
    categories: categories.map((category) => ({
      id: serializeObjectId(category._id),
      name: category.name,
      slug: category.slug
    })),
    publishedAt: article.publishedAt,
    scheduledAt: article.scheduledAt,
    views: article.views,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
  };
};

const getPublicArticles = async (options: {
  limit: number;
  sort: Record<string, 1 | -1>;
  isFeatured?: boolean;
}): Promise<Record<string, unknown>[]> => {
  await syncScheduledArticles();
  const filter: Record<string, unknown> = isPublishableFilter();
  if (options.isFeatured) {
    filter.isFeatured = true;
  }

  const articles = await publicArticlesCollection()
    .find(filter)
    .sort(options.sort)
    .limit(options.isFeatured ? options.limit * 4 : options.limit)
    .toArray();

  const normalizedArticles = options.isFeatured
    ? articles.filter((article) => isActiveFeaturedArticle(article)).slice(0, options.limit)
    : articles.slice(0, options.limit);

  return Promise.all(normalizedArticles.map(toPublicArticle));
};

const normalizeRecommendationTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0)
    )
  );

const toRecommendedArticle = async (
  article: {
    _id: ObjectId;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImageUrl: string | null;
    isFeatured: boolean;
    authorId: ObjectId;
    categoryIds: ObjectId[];
    publishedAt: Date | null;
    scheduledAt: Date | null;
    views: number;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  },
  matchedTags: string[]
): Promise<Record<string, unknown>> => {
  const base = await toPublicArticle(article);

  return {
    ...base,
    matchedTags,
    tags: article.tags
  };
};

export const getHome = async (_req: Request, res: Response): Promise<void> => {
  const [recent, featured, latest] = await Promise.all([
    getPublicArticles({ limit: 12, sort: { publishedAt: -1, createdAt: -1 } }),
    getPublicArticles({
      limit: 5,
      sort: { publishedAt: -1, createdAt: -1 },
      isFeatured: true
    }),
    getPublicArticles({ limit: 8, sort: { createdAt: -1 } })
  ]);

  res.status(200).json({
    recent,
    featured,
    latest
  });
};

export const getFeatured = async (_req: Request, res: Response): Promise<void> => {
  const featured = await getPublicArticles({
    limit: 5,
    sort: { publishedAt: -1, createdAt: -1 },
    isFeatured: true
  });
  res.status(200).json(featured);
};

export const getLatest = async (_req: Request, res: Response): Promise<void> => {
  const latest = await getPublicArticles({ limit: 8, sort: { createdAt: -1 } });
  res.status(200).json(latest);
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categoriesSummary = await publicArticlesCollection()
    .aggregate<{ _id: ObjectId; total: number }>([
      { $match: isPublishableFilter() },
      { $unwind: '$categoryIds' },
      { $group: { _id: '$categoryIds', total: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ])
    .toArray();

  if (!categoriesSummary.length) {
    res.status(200).json([]);
    return;
  }

  const categories = await publicCategoriesCollection()
    .find({ _id: { $in: categoriesSummary.map((category) => category._id) } })
    .toArray();

  const categoriesById = new Map(categories.map((category) => [category._id.toString(), category]));

  res.status(200).json(
    categoriesSummary
      .map((item) => {
        const category = categoriesById.get(item._id.toString());
        if (!category) {
          return null;
        }

        return {
          id: category._id.toString(),
          name: category.name,
          slug: category.slug,
          description: category.description ?? null,
          articleCount: item.total
        };
      })
      .filter((category): category is NonNullable<typeof category> => category !== null)
  );
};

export const getArticleBySlug = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const { slug } = req.params;
  const article = await publicArticlesCollection().findOne({
    slug,
    deletedAt: null
  });

  if (!article) {
    res.status(404).json({ message: 'Article not found' });
    return;
  }

  // Check if article is publishable
  const now = new Date();
  const isPublishable = article.status === 'published' || (article.status === 'scheduled' && article.scheduledAt && article.scheduledAt <= now);

  if (!isPublishable) {
    // If not publishable, check for admin session
    const token = req.cookies?.[env.COOKIE_NAME];
    let isAdmin = false;
    if (token) {
      try {
        const user = verifyAuthToken(token);
        if (user) isAdmin = true;
      } catch (e) { }
    }

    if (!isAdmin) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
  }

  await publicArticlesCollection().updateOne({ _id: article._id }, { $inc: { views: 1 } });
  res.status(200).json(await toPublicArticle({ ...article, views: article.views + 1 }));
};

export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const { id } = req.params as { id: string };
  const articleObjectId = id && ObjectId.isValid(id) ? new ObjectId(id) : null;
  if (!articleObjectId) {
    res.status(400).json({ message: 'Invalid article id' });
    return;
  }

  const article = await publicArticlesCollection().findOne({
    _id: articleObjectId,
    deletedAt: null
  });

  if (!article) {
    res.status(404).json({ message: 'Article not found' });
    return;
  }

  // Check if article is publishable
  const now = new Date();
  const isPublishable = article.status === 'published' || (article.status === 'scheduled' && article.scheduledAt && article.scheduledAt <= now);

  if (!isPublishable) {
    // If not publishable, check for admin session
    const token = req.cookies?.[env.COOKIE_NAME];
    let isAdmin = false;
    if (token) {
      try {
        const user = verifyAuthToken(token);
        if (user) isAdmin = true;
      } catch (e) { }
    }

    if (!isAdmin) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
  }

  await publicArticlesCollection().updateOne({ _id: article._id }, { $inc: { views: 1 } });
  res.status(200).json(await toPublicArticle({ ...article, views: article.views + 1 }));
};

export const getArticlesByCategorySlug = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const { slug } = req.params;
  const category = await publicCategoriesCollection().findOne({ slug });
  if (!category) {
    res.status(404).json({ message: 'Category not found' });
    return;
  }

  const articles = await publicArticlesCollection()
    .find({ ...isPublishableFilter(), categoryIds: category._id })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();

  res.status(200).json({
    category: {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug
    },
    articles: await Promise.all(articles.map(toPublicArticle))
  });
};

export const searchArticles = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const query = String(req.query.q || '').trim();
  const limit = Number(req.query.limit || 20);
  const sortParam = String(req.query.sort || 'newest');

  const regex = new RegExp(query, 'i');

  let sortObj: Record<string, 1 | -1> = { publishedAt: -1, createdAt: -1 };
  if (sortParam === 'relevant') {
    sortObj = { views: -1, publishedAt: -1 };
  } else if (sortParam === 'oldest') {
    sortObj = { publishedAt: 1, createdAt: 1 };
  }

  const articles = await publicArticlesCollection()
    .find({
      ...isPublishableFilter(),
      $or: [{ title: { $regex: regex } }, { excerpt: { $regex: regex } }]
    })
    .sort(sortObj)
    .limit(limit)
    .toArray();

  res.status(200).json({
    q: query,
    total: articles.length,
    items: await Promise.all(articles.map(toPublicArticle))
  });
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const tags = normalizeRecommendationTags(String(req.query.tags || ''));
  const limit = Number(req.query.limit || 4);
  const excludeId = String(req.query.excludeId || '').trim();
  const excludeObjectId = excludeId && ObjectId.isValid(excludeId) ? new ObjectId(excludeId) : null;

  if (excludeId && !excludeObjectId) {
    res.status(400).json({ message: 'Invalid article id' });
    return;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const articles = await publicArticlesCollection()
    .find({
      ...isPublishableFilter(),
      publishedAt: { $gte: weekAgo },
      ...(excludeObjectId ? { _id: { $ne: excludeObjectId } } : {})
    })
    .sort({ publishedAt: -1, createdAt: -1 })
    .toArray();

  const normalizedTags = new Set(tags);
  const recommendations = articles
    .map((article) => {
      const matchedTags = tags.length
        ? article.tags
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => normalizedTags.has(tag))
        : [];

      return {
        article,
        matchedTags
      };
    })
    .filter(({ matchedTags }) => (tags.length ? matchedTags.length > 0 : true))
    .sort((left, right) => {
      if (right.matchedTags.length !== left.matchedTags.length) {
        return right.matchedTags.length - left.matchedTags.length;
      }

      const rightPublishedAt = right.article.publishedAt?.getTime() ?? 0;
      const leftPublishedAt = left.article.publishedAt?.getTime() ?? 0;
      if (rightPublishedAt !== leftPublishedAt) {
        return rightPublishedAt - leftPublishedAt;
      }

      return right.article.createdAt.getTime() - left.article.createdAt.getTime();
    })
    .slice(0, limit);

  res.status(200).json({
    items: await Promise.all(recommendations.map(({ article, matchedTags }) => toRecommendedArticle(article, matchedTags)))
  });
};

export const getTrending = async (req: Request, res: Response): Promise<void> => {
  const limit = Number(req.query.limit || 10);
  const trending = await getPublicArticles({
    limit,
    sort: { views: -1, publishedAt: -1, createdAt: -1 }
  });

  res.status(200).json(trending);
};

export const getArchive = async (req: Request, res: Response): Promise<void> => {
  await syncScheduledArticles();
  const year = Number(req.params.year);
  const month = Number(req.params.month);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const archiveDateFilter = {
    $or: [
      { publishedAt: { $gte: start, $lt: end } },
      { publishedAt: null, scheduledAt: { $gte: start, $lt: end } }
    ]
  };

  const articles = await publicArticlesCollection()
    .find({
      $and: [isPublishableFilter(), archiveDateFilter]
    })
    .sort({ publishedAt: -1, scheduledAt: -1, createdAt: -1 })
    .toArray();

  res.status(200).json({
    year,
    month,
    total: articles.length,
    items: await Promise.all(articles.map(toPublicArticle))
  });
};

export const getSitemap = async (_req: Request, res: Response): Promise<void> => {
  const [articles, categories] = await Promise.all([
    publicArticlesCollection()
      .find(isPublishableFilter())
      .project({ slug: 1 })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray(),
    publicCategoriesCollection().find({}).project({ slug: 1 }).sort({ name: 1 }).toArray()
  ]);

  const urls = [
    `${PUBLIC_API_BASE_PATH}/home`,
    `${PUBLIC_API_BASE_PATH}/categories`,
    `${PUBLIC_API_BASE_PATH}/featured`,
    `${PUBLIC_API_BASE_PATH}/latest`,
    `${PUBLIC_API_BASE_PATH}/trending`,
    ...categories.map((category) => `${PUBLIC_API_BASE_PATH}/category/${category.slug}`),
    ...articles.map((article) => `${PUBLIC_API_BASE_PATH}/article/${article.slug}`)
  ];

  res.status(200).json({
    generatedAt: new Date().toISOString(),
    total: urls.length,
    urls
  });
};
