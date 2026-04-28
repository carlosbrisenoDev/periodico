import { MongoServerError, ObjectId } from 'mongodb';
import { authorsCollection } from '../author/author.model.js';
import { categoriesCollection } from '../category/category.model.js';
import { articlesCollection } from './article.model.js';
const FEATURED_TYPES = new Set(['none', 'hero', 'headline', 'category_hero', 'breaking']);
const FEATURED_HERO_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const isFeaturedType = (value) => typeof value === 'string' && FEATURED_TYPES.has(value);
const resolveFeaturedType = (article) => {
    if (isFeaturedType(article.featuredType)) {
        return article.featuredType;
    }
    return article.isFeatured ? 'hero' : 'none';
};
const resolveFeaturedAt = (featuredType, featuredAt) => {
    if (featuredType === 'none') {
        return null;
    }
    return featuredAt ?? new Date();
};
const activeArticleFilter = () => ({ deletedAt: null });
const deletedArticleFilter = () => ({
    deletedAt: { $exists: true, $ne: null }
});
const enforceFeaturedLimits = async (articleId, featuredType, categoryObjectIds = []) => {
    if (featuredType === 'none')
        return;
    if (featuredType === 'hero') {
        const heroArticles = await articlesCollection().find({ featuredType: 'hero' }).toArray();
        await Promise.all(heroArticles
            .filter((article) => !articleId || article._id.toString() !== articleId.toString())
            .map((article) => articlesCollection().updateOne({ _id: article._id }, { $set: { isFeatured: false, featuredType: 'none', featuredAt: null, updatedAt: new Date() } })));
    }
    else if (featuredType === 'headline') {
        const headlineArticles = await articlesCollection()
            .find({ featuredType: 'headline' })
            .sort({ featuredAt: -1 })
            .toArray();
        const others = headlineArticles.filter((article) => !articleId || article._id.toString() !== articleId.toString());
        if (others.length > 1) {
            const toDemote = others.slice(1);
            await Promise.all(toDemote.map((article) => articlesCollection().updateOne({ _id: article._id }, { $set: { isFeatured: false, featuredType: 'none', featuredAt: null, updatedAt: new Date() } })));
        }
    }
    else if (featuredType === 'category_hero' && categoryObjectIds.length > 0) {
        const catHeroArticles = await articlesCollection()
            .find({ featuredType: 'category_hero', categoryIds: { $in: categoryObjectIds } })
            .toArray();
        await Promise.all(catHeroArticles
            .filter((article) => !articleId || article._id.toString() !== articleId.toString())
            .map((article) => articlesCollection().updateOne({ _id: article._id }, { $set: { isFeatured: false, featuredType: 'none', featuredAt: null, updatedAt: new Date() } })));
    }
    else if (featuredType === 'breaking' && categoryObjectIds.length > 0) {
        for (const catId of categoryObjectIds) {
            const breakingArticles = await articlesCollection()
                .find({ featuredType: 'breaking', categoryIds: catId })
                .sort({ featuredAt: -1 })
                .toArray();
            const others = breakingArticles.filter((article) => !articleId || article._id.toString() !== articleId.toString());
            if (others.length > 1) {
                const toDemote = others.slice(1);
                await Promise.all(toDemote.map((article) => articlesCollection().updateOne({ _id: article._id }, { $set: { isFeatured: false, featuredType: 'none', featuredAt: null, updatedAt: new Date() } })));
            }
        }
    }
};
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
const toSlug = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
const toArticleResponse = (article) => ({
    id: article._id.toString(),
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featuredImageUrl: article.featuredImageUrl,
    tags: article.tags ?? [],
    status: article.status,
    isFeatured: article.isFeatured,
    featuredType: resolveFeaturedType(article),
    featuredAt: article.featuredAt,
    deletedAt: article.deletedAt,
    authorId: article.authorId.toString(),
    categoryIds: article.categoryIds.map((id) => id.toString()),
    scheduledAt: article.scheduledAt,
    publishedAt: article.publishedAt,
    views: article.views,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt
});
const parseObjectId = (value) => {
    if (!ObjectId.isValid(value)) {
        return null;
    }
    return new ObjectId(value);
};
const parseObjectIdArray = (values) => {
    const ids = [];
    for (const value of values) {
        const objectId = parseObjectId(value);
        if (!objectId) {
            return null;
        }
        ids.push(objectId);
    }
    return ids;
};
const toNonEmptyString = (value) => typeof value === 'string' ? value.trim() : '';
const normalizeTags = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    const seen = new Set();
    const tags = [];
    for (const entry of value) {
        if (typeof entry !== 'string') {
            continue;
        }
        const cleanTag = entry.trim();
        if (!cleanTag || seen.has(cleanTag)) {
            continue;
        }
        seen.add(cleanTag);
        tags.push(cleanTag);
    }
    return tags;
};
const ensureArticleRelationsAreValid = async (authorId, categoryIds) => {
    const authorFound = await authorsCollection().findOne({ _id: authorId });
    if (!authorFound) {
        return 'Author not found';
    }
    if (categoryIds.length) {
        const categoriesCount = await categoriesCollection().countDocuments({ _id: { $in: categoryIds } });
        if (categoriesCount !== categoryIds.length) {
            return 'One or more categories not found';
        }
    }
    return null;
};
const ensurePublishableData = async (article) => {
    if (!toNonEmptyString(article.title)) {
        return 'Title is required to publish';
    }
    if (!toNonEmptyString(article.excerpt)) {
        return 'Excerpt is required to publish';
    }
    if (!toNonEmptyString(article.content)) {
        return 'Content is required to publish';
    }
    if (!article.categoryIds.length) {
        return 'At least one category is required to publish';
    }
    return ensureArticleRelationsAreValid(article.authorId, article.categoryIds);
};
const generateUniqueSlug = async (base, currentId) => {
    let slug = toSlug(base);
    let counter = 1;
    while (true) {
        const existing = await articlesCollection().findOne({
            slug, ...(currentId ? { _id: { $ne: currentId } } : {})
        });
        if (!existing) {
            return slug;
        }
        counter += 1;
        slug = `${toSlug(base)}-${counter}`;
    }
};
export const createArticle = async (req, res) => {
    try {
        const { title, slug, excerpt, content, featuredImageUrl, tags, status, isFeatured, featuredType, authorId, categoryIds, scheduledAt } = req.body;
        const authorObjectId = parseObjectId(authorId);
        if (!authorObjectId) {
            res.status(400).json({ message: 'Invalid authorId' });
            return;
        }
        const categoryObjectIds = parseObjectIdArray(categoryIds);
        if (!categoryObjectIds) {
            res.status(400).json({ message: 'Invalid categoryIds' });
            return;
        }
        const relationsError = await ensureArticleRelationsAreValid(authorObjectId, categoryObjectIds);
        if (relationsError) {
            res.status(relationsError === 'Author not found' || relationsError === 'One or more categories not found' ? 404 : 400).json({
                message: relationsError
            });
            return;
        }
        const hasScheduledAt = Object.prototype.hasOwnProperty.call(req.body, 'scheduledAt');
        let scheduledDate = null;
        if (status === 'scheduled') {
            if (!scheduledAt) {
                res.status(400).json({ message: 'scheduledAt is required for scheduled articles' });
                return;
            }
            scheduledDate = new Date(scheduledAt);
        }
        else if (hasScheduledAt && scheduledAt) {
            res.status(400).json({ message: 'scheduledAt is only allowed when status is scheduled' });
            return;
        }
        if (status === 'published') {
            const publishableError = await ensurePublishableData({
                title, excerpt, content, authorId: authorObjectId, categoryIds: categoryObjectIds
            });
            if (publishableError) {
                res.status(publishableError === 'Author not found' || publishableError === 'One or more categories not found' ? 404 : 400).json({
                    message: publishableError
                });
                return;
            }
        }
        const now = new Date();
        const normalizedFeaturedType = isFeaturedType(featuredType)
            ? featuredType
            : isFeatured
                ? 'hero'
                : 'none';
        const normalizedFeaturedAt = resolveFeaturedAt(normalizedFeaturedType);
        if (normalizedFeaturedType !== 'none') {
            await enforceFeaturedLimits(undefined, normalizedFeaturedType, categoryObjectIds);
        }
        const article = {
            _id: new ObjectId(),
            title,
            slug: await generateUniqueSlug(slug ?? title),
            excerpt,
            content,
            featuredImageUrl: featuredImageUrl ?? null,
            tags: normalizeTags(tags),
            status,
            isFeatured: normalizedFeaturedType !== 'none',
            featuredType: normalizedFeaturedType,
            featuredAt: normalizedFeaturedAt,
            authorId: authorObjectId,
            categoryIds: categoryObjectIds,
            scheduledAt: scheduledDate,
            publishedAt: status === 'published' ? now : null,
            views: 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null
        };
        await articlesCollection().insertOne(article);
        res.status(201).json(toArticleResponse(article));
    }
    catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            res.status(409).json({ message: 'Article slug already exists' });
            return;
        }
        throw error;
    }
};
export const listArticles = async (_req, res) => {
    const queryStatus = readParam(_req.query.status);
    const queryText = readParam(_req.query.q).trim();
    const queryPage = readParam(_req.query.page);
    const queryLimit = readParam(_req.query.limit);
    const filters = {};
    if (queryStatus) {
        filters.status = queryStatus;
    }
    if (queryText) {
        const searchRegex = new RegExp(queryText, 'i');
        filters.$or = [{ title: { $regex: searchRegex } }, { excerpt: { $regex: searchRegex } }, { content: { $regex: searchRegex } }];
    }
    const hasPage = queryPage !== '';
    const hasLimit = queryLimit !== '';
    const page = hasPage ? Number(queryPage) : 1;
    const requestedLimit = hasLimit ? Number(queryLimit) : 20;
    Object.assign(filters, activeArticleFilter());
    const total = await articlesCollection().countDocuments(filters);
    const limit = hasPage || hasLimit ? requestedLimit : total || 20;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const cursor = articlesCollection().find(filters).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const articles = await cursor.toArray();
    res.status(200).json({
        items: articles.map(toArticleResponse), page, limit, total, totalPages
    });
};
export const getArticleById = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const article = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(article));
};
export const getArticleBySlug = async (req, res) => {
    const slug = readParam(req.params.slug).trim();
    const article = await articlesCollection().findOne({ slug, deletedAt: null });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(article));
};
export const updateArticle = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const updates = {};
    let nextAuthorId = articleFound.authorId;
    let nextCategoryIds = articleFound.categoryIds;
    if (req.body.title !== undefined) {
        updates.title = req.body.title;
    }
    if (req.body.excerpt !== undefined) {
        updates.excerpt = req.body.excerpt;
    }
    if (req.body.content !== undefined) {
        updates.content = req.body.content;
    }
    if (req.body.featuredImageUrl !== undefined) {
        updates.featuredImageUrl = req.body.featuredImageUrl;
    }
    if (req.body.tags !== undefined) {
        updates.tags = normalizeTags(req.body.tags);
    }
    const requestedFeaturedType = typeof req.body.featuredType === 'string' && isFeaturedType(req.body.featuredType)
        ? req.body.featuredType
        : undefined;
    const requestedIsFeatured = typeof req.body.isFeatured === 'boolean' ? req.body.isFeatured : undefined;
    if (requestedFeaturedType !== undefined || requestedIsFeatured !== undefined) {
        const nextFeaturedType = requestedFeaturedType ?? (requestedIsFeatured ? resolveFeaturedType(articleFound) : 'none');
        updates.isFeatured = nextFeaturedType !== 'none';
        updates.featuredType = nextFeaturedType;
        updates.featuredAt = nextFeaturedType === 'hero' ? new Date() : null;
        if (nextFeaturedType !== 'none') {
            const articleCategories = updates.categoryIds || articleFound.categoryIds || [];
            await enforceFeaturedLimits(articleId, nextFeaturedType, articleCategories);
        }
    }
    if (req.body.slug !== undefined || req.body.title !== undefined) {
        updates.slug = await generateUniqueSlug(req.body.slug ?? req.body.title, articleId);
    }
    if (req.body.authorId !== undefined) {
        const authorObjectId = parseObjectId(req.body.authorId);
        if (!authorObjectId) {
            res.status(400).json({ message: 'Invalid authorId' });
            return;
        }
        const authorFound = await authorsCollection().findOne({ _id: authorObjectId });
        if (!authorFound) {
            res.status(404).json({ message: 'Author not found' });
            return;
        }
        updates.authorId = authorObjectId;
        nextAuthorId = authorObjectId;
    }
    if (req.body.categoryIds !== undefined) {
        const categoryObjectIds = parseObjectIdArray(req.body.categoryIds);
        if (!categoryObjectIds) {
            res.status(400).json({ message: 'Invalid categoryIds' });
            return;
        }
        if (categoryObjectIds.length) {
            const categoriesCount = await categoriesCollection().countDocuments({ _id: { $in: categoryObjectIds } });
            if (categoriesCount !== categoryObjectIds.length) {
                res.status(404).json({ message: 'One or more categories not found' });
                return;
            }
        }
        updates.categoryIds = categoryObjectIds;
        nextCategoryIds = categoryObjectIds;
    }
    const hasScheduledAt = Object.prototype.hasOwnProperty.call(req.body, 'scheduledAt');
    const nextStatus = req.body.status ?? articleFound.status;
    const nextScheduledAt = hasScheduledAt ? req.body.scheduledAt ? new Date(req.body.scheduledAt) : null : articleFound.scheduledAt;
    if (nextStatus === 'scheduled' && !nextScheduledAt) {
        res.status(400).json({ message: 'scheduledAt is required for scheduled articles' });
        return;
    }
    if (nextStatus !== 'scheduled' && hasScheduledAt && nextScheduledAt) {
        res.status(400).json({ message: 'scheduledAt is only allowed when status is scheduled' });
        return;
    }
    if (nextStatus === 'published') {
        const publishableError = await ensurePublishableData({
            title: req.body.title ?? articleFound.title,
            excerpt: req.body.excerpt ?? articleFound.excerpt,
            content: req.body.content ?? articleFound.content,
            authorId: nextAuthorId,
            categoryIds: nextCategoryIds
        });
        if (publishableError) {
            res.status(publishableError === 'Author not found' || publishableError === 'One or more categories not found' ? 404 : 400).json({
                message: publishableError
            });
            return;
        }
    }
    if (req.body.status !== undefined) {
        updates.status = req.body.status;
    }
    if (nextStatus === 'published') {
        updates.publishedAt = articleFound.publishedAt ?? new Date();
        updates.scheduledAt = null;
    }
    else if (nextStatus === 'draft') {
        updates.publishedAt = null;
        updates.scheduledAt = null;
    }
    else if (nextStatus === 'scheduled') {
        updates.publishedAt = null;
        updates.scheduledAt = nextScheduledAt;
    }
    else if (hasScheduledAt) {
        updates.scheduledAt = nextScheduledAt;
    }
    updates.updatedAt = new Date();
    let updatedArticle = null;
    try {
        updatedArticle = await articlesCollection().findOneAndUpdate({ _id: articleId }, { $set: updates }, { returnDocument: 'after' });
    }
    catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            res.status(409).json({ message: 'Article slug already exists' });
            return;
        }
        throw error;
    }
    if (!updatedArticle) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(updatedArticle));
};
export const updateArticleFeature = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const currentFeaturedType = resolveFeaturedType(articleFound);
    let nextFeaturedType;
    let nextIsFeatured;
    if (typeof req.body.featuredType === 'string') {
        nextFeaturedType = req.body.featuredType;
        nextIsFeatured = nextFeaturedType !== 'none';
    }
    else if (typeof req.body.isFeatured === 'boolean') {
        nextIsFeatured = req.body.isFeatured;
        nextFeaturedType = nextIsFeatured
            ? currentFeaturedType === 'none'
                ? 'hero'
                : currentFeaturedType
            : 'none';
    }
    else {
        nextFeaturedType = currentFeaturedType === 'none' ? 'hero' : 'none';
        nextIsFeatured = nextFeaturedType !== 'none';
    }
    if (nextFeaturedType !== 'none') {
        await enforceFeaturedLimits(articleId, nextFeaturedType, articleFound.categoryIds || []);
    }
    const updatedArticle = await articlesCollection().findOneAndUpdate({ _id: articleId }, {
        $set: {
            isFeatured: nextIsFeatured,
            featuredType: nextFeaturedType,
            featuredAt: nextFeaturedType === 'hero' ? new Date() : null,
            updatedAt: new Date()
        }
    }, { returnDocument: 'after' });
    if (!updatedArticle) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(updatedArticle));
};
export const publishArticleNow = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const publishableError = await ensurePublishableData({
        title: articleFound.title,
        excerpt: articleFound.excerpt,
        content: articleFound.content,
        authorId: articleFound.authorId,
        categoryIds: articleFound.categoryIds
    });
    if (publishableError) {
        res.status(publishableError === 'Author not found' || publishableError === 'One or more categories not found' ? 404 : 400).json({
            message: publishableError
        });
        return;
    }
    const now = new Date();
    const publishedAt = articleFound.publishedAt ?? now;
    const updatedArticle = await articlesCollection().findOneAndUpdate({ _id: articleId }, {
        $set: {
            status: 'published', publishedAt, scheduledAt: null, updatedAt: now
        }
    }, { returnDocument: 'after' });
    if (!updatedArticle) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(updatedArticle));
};
export const duplicateArticle = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const now = new Date();
    const duplicateTitle = `${articleFound.title} (copy)`;
    const duplicatedArticle = {
        _id: new ObjectId(),
        title: duplicateTitle,
        slug: await generateUniqueSlug(`${articleFound.slug}-copy`),
        excerpt: articleFound.excerpt,
        content: articleFound.content,
        featuredImageUrl: articleFound.featuredImageUrl,
        tags: articleFound.tags ?? [],
        status: 'draft',
        isFeatured: false,
        featuredType: 'none',
        featuredAt: null,
        authorId: articleFound.authorId,
        categoryIds: articleFound.categoryIds,
        scheduledAt: null,
        publishedAt: null,
        views: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null
    };
    await articlesCollection().insertOne(duplicatedArticle);
    res.status(201).json(toArticleResponse(duplicatedArticle));
};
export const deleteArticle = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, deletedAt: null });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    await articlesCollection().findOneAndUpdate({ _id: articleId }, {
        $set: {
            deletedAt: new Date(),
            isFeatured: false,
            featuredType: 'none',
            featuredAt: null,
            updatedAt: new Date()
        }
    }, { returnDocument: 'after' });
    res.status(200).json({ message: 'Article moved to trash' });
};
export const listDeletedArticles = async (_req, res) => {
    const articles = await articlesCollection()
        .find(deletedArticleFilter())
        .sort({ deletedAt: -1, updatedAt: -1 })
        .toArray();
    res.status(200).json({
        items: articles.map(toArticleResponse),
        total: articles.length
    });
};
export const restoreArticle = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, ...deletedArticleFilter() });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const updatedArticle = await articlesCollection().findOneAndUpdate({ _id: articleId }, {
        $set: {
            deletedAt: null,
            updatedAt: new Date()
        }
    }, { returnDocument: 'after' });
    if (!updatedArticle) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(updatedArticle));
};
export const purgeArticle = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId, ...deletedArticleFilter() });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const result = await articlesCollection().deleteOne({ _id: articleId });
    if (!result.deletedCount) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json({ message: 'Article deleted permanently' });
};
export const updateArticleStatus = async (req, res) => {
    const articleId = parseObjectId(readParam(req.params.id));
    if (!articleId) {
        res.status(400).json({ message: 'Invalid article id' });
        return;
    }
    const articleFound = await articlesCollection().findOne({ _id: articleId });
    if (!articleFound) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    const { status, scheduledAt } = req.body;
    const updates = {
        status, updatedAt: new Date()
    };
    if (status === 'scheduled' && !scheduledAt) {
        res.status(400).json({ message: 'scheduledAt is required for scheduled articles' });
        return;
    }
    if (status !== 'scheduled' && scheduledAt) {
        res.status(400).json({ message: 'scheduledAt is only allowed when status is scheduled' });
        return;
    }
    if (status === 'published') {
        const publishableError = await ensurePublishableData({
            title: articleFound.title,
            excerpt: articleFound.excerpt,
            content: articleFound.content,
            authorId: articleFound.authorId,
            categoryIds: articleFound.categoryIds
        });
        if (publishableError) {
            res.status(publishableError === 'Author not found' || publishableError === 'One or more categories not found' ? 404 : 400).json({
                message: publishableError
            });
            return;
        }
        updates.publishedAt = articleFound.publishedAt ?? new Date();
        updates.scheduledAt = null;
    }
    if (status === 'draft') {
        updates.publishedAt = null;
        updates.scheduledAt = null;
    }
    if (status === 'scheduled') {
        updates.publishedAt = null;
        updates.scheduledAt = new Date(scheduledAt);
    }
    const updatedArticle = await articlesCollection().findOneAndUpdate({ _id: articleId }, { $set: updates }, { returnDocument: 'after' });
    if (!updatedArticle) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.status(200).json(toArticleResponse(updatedArticle));
};
