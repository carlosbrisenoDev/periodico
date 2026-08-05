import { ObjectId } from 'mongodb';
import { env } from '../../config.js';
import { verifyAuthToken } from '../../libs/jwt.js';
import { isPublishableFilter } from '../public/public.model.js';
import { articlesCollection } from '../article/article.model.js';
import { authorsCollection } from './author.model.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
const parseOptionalObjectId = (value) => {
    if (value === undefined) {
        return undefined;
    }
    if (value === null || value === '') {
        return null;
    }
    if (typeof value !== 'string' || !ObjectId.isValid(value)) {
        return undefined;
    }
    return new ObjectId(value);
};
const mapAuthorResponse = (author) => ({
    id: author._id.toString(),
    name: author.name,
    bio: author.bio,
    avatarUrl: author.avatarUrl,
    userId: author.userId ? author.userId.toString() : null,
    createdAt: author.createdAt,
    updatedAt: author.updatedAt
});
export const createAuthor = async (req, res) => {
    const { name, bio, avatarUrl } = req.body;
    const parsedUserId = parseOptionalObjectId(req.body.userId);
    if (req.body.userId !== undefined && parsedUserId === undefined) {
        res.status(400).json({ message: 'Invalid user id' });
        return;
    }
    const now = new Date();
    const result = await authorsCollection().insertOne({
        _id: new ObjectId(),
        name,
        bio,
        avatarUrl,
        userId: parsedUserId ?? null,
        createdAt: now,
        updatedAt: now
    });
    res.status(201).json({ id: result.insertedId.toString(), name, bio, avatarUrl, userId: parsedUserId?.toString() ?? null });
};
export const listAuthors = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const filters = req.user.role === 'admin' ? {} : { userId: new ObjectId(req.user.userId) };
    const authors = await authorsCollection().find(filters).sort({ createdAt: -1 }).toArray();
    res.status(200).json(authors.map(mapAuthorResponse));
};
export const getAuthorById = async (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid author id' });
        return;
    }
    const filters = { _id: new ObjectId(id) };
    if (req.user.role !== 'admin') {
        filters.userId = new ObjectId(req.user.userId);
    }
    const author = await authorsCollection().findOne(filters);
    if (!author) {
        res.status(404).json({ message: 'Author not found' });
        return;
    }
    res.status(200).json(mapAuthorResponse(author));
};
export const getAuthorArticles = async (req, res) => {
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
    const scope = readParam(req.query.scope) || 'public';
    const filters = { authorId: author._id };
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
        }
        catch (_error) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
    }
    else {
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
            featuredImagePosition: article.featuredImagePosition ?? 'center',
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
export const updateAuthor = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid author id' });
        return;
    }
    const updates = {};
    if (req.body.name) {
        updates.name = req.body.name;
    }
    if (req.body.bio !== undefined) {
        updates.bio = req.body.bio;
    }
    if (req.body.avatarUrl !== undefined) {
        updates.avatarUrl = req.body.avatarUrl;
    }
    if (req.body.userId !== undefined) {
        const parsedUserId = parseOptionalObjectId(req.body.userId);
        if (parsedUserId === undefined) {
            res.status(400).json({ message: 'Invalid user id' });
            return;
        }
        updates.userId = parsedUserId;
    }
    updates.updatedAt = new Date();
    const result = await authorsCollection().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: 'after' });
    if (!result) {
        res.status(404).json({ message: 'Author not found' });
        return;
    }
    res.status(200).json({
        ...mapAuthorResponse(result)
    });
};
export const deleteAuthor = async (req, res) => {
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
