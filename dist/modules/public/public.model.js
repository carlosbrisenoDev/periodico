import { articlesCollection } from '../article/article.model.js';
import { authorsCollection } from '../author/author.model.js';
import { categoriesCollection } from '../category/category.model.js';
export const publicArticlesCollection = articlesCollection;
export const publicAuthorsCollection = authorsCollection;
export const publicCategoriesCollection = categoriesCollection;
export const isPublishableFilter = () => ({
    deletedAt: null,
    $or: [{ status: 'published' }, { status: 'scheduled', scheduledAt: { $lte: new Date() } }]
});
export const serializeObjectId = (value) => value ? value.toString() : null;
