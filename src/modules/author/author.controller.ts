import { Request, Response } from 'express';
import { Filter, ObjectId } from 'mongodb';
import { env } from '../../config.js';
import { verifyAuthToken } from '../../libs/jwt.js';
import { isPublishableFilter } from '../public/public.model.js';
import { ArticleDoc, articlesCollection } from '../article/article.model.js';
import { authorsCollection } from './author.model.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

export const createAuthor = async (req: Request, res: Response): Promise<void> => {
  const { name, bio, avatarUrl } = req.body;
  const now = new Date();
  const author = {
    _id: new ObjectId(),
    name,
    bio,
    avatarUrl,
    createdAt: now,
    updatedAt: now
  };

  await authorsCollection().insertOne(author);

  res.status(201).json({ id: author._id.toString(), name, bio, avatarUrl });
};

export const listAuthors = async (_req: Request, res: Response): Promise<void> => {
  const authors = await authorsCollection().find({}).sort({ createdAt: -1 }).toArray();
  res.status(200).json(
    authors.map((author) => ({
      id: author._id.toString(),
      name: author.name,
      bio: author.bio,
      avatarUrl: author.avatarUrl,
      createdAt: author.createdAt,
      updatedAt: author.updatedAt
    }))
  );
};

export const getAuthorById = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid author id' });
    return;
  }

  const author = await authorsCollection().findOne({ _id: new ObjectId(id) });
  if (!author) {
    res.status(404).json({ message: 'Author not found' });
    return;
  }

  res.status(200).json({
    id: author._id.toString(),
    name: author.name,
    bio: author.bio,
    avatarUrl: author.avatarUrl,
    createdAt: author.createdAt,
    updatedAt: author.updatedAt
  });
};

export const getAuthorArticles = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid author id' });
    return;
  }

  const author = await authorsCollection().findOne({ _id: new ObjectId(id) });
  if (!author) {
    res.status(404).json({ message: 'Author not found' });
    return;
  }

  const scope = readParam(req.query.scope as string | string[] | undefined) || 'public';
  const filters: Filter<ArticleDoc> = { authorId: author._id };

  if (scope === 'all') {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      const user = verifyAuthToken(token);
      if (user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }
    } catch (_error) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
  } else {
    Object.assign(filters, isPublishableFilter());
  }

  const articles = await articlesCollection().find(filters).sort({ publishedAt: -1, createdAt: -1 }).toArray();
  res.status(200).json({
    author: {
      id: author._id.toString(),
      name: author.name
    },
    scope,
    total: articles.length,
    articles: articles.map((article) => ({
      id: article._id.toString(),
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      featuredImageUrl: article.featuredImageUrl,
      status: article.status,
      isFeatured: article.isFeatured,
      categoryIds: article.categoryIds.map((categoryId) => categoryId.toString()),
      publishedAt: article.publishedAt,
      scheduledAt: article.scheduledAt,
      views: article.views,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt
    }))
  });
};

export const updateAuthor = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid author id' });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (req.body.name) {
    updates.name = req.body.name;
  }
  if (req.body.bio !== undefined) {
    updates.bio = req.body.bio;
  }
  if (req.body.avatarUrl !== undefined) {
    updates.avatarUrl = req.body.avatarUrl;
  }
  updates.updatedAt = new Date();

  const result = await authorsCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) {
    res.status(404).json({ message: 'Author not found' });
    return;
  }

  res.status(200).json({
    id: result._id.toString(),
    name: result.name,
    bio: result.bio,
    avatarUrl: result.avatarUrl,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  });
};

export const deleteAuthor = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid author id' });
    return;
  }

  const result = await authorsCollection().deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) {
    res.status(404).json({ message: 'Author not found' });
    return;
  }

  res.status(200).json({ message: 'Author deleted' });
};
