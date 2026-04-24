import { Types } from 'mongoose';
import { articlesCollection, ArticleDoc } from '../article/article.model.js';
import { authorsCollection, AuthorDoc } from '../author/author.model.js';
import { categoriesCollection, CategoryDoc } from '../category/category.model.js';

export const publicArticlesCollection = articlesCollection;
export const publicAuthorsCollection = authorsCollection;
export const publicCategoriesCollection = categoriesCollection;

export const isPublishableFilter = (): Record<string, unknown> => ({
  deletedAt: null,
  $or: [{ status: 'published' }, { status: 'scheduled', scheduledAt: { $lte: new Date() } }]
});

export const serializeObjectId = (value: Types.ObjectId | null | undefined): string | null =>
  value ? value.toString() : null;

export type { ArticleDoc, AuthorDoc, CategoryDoc };
