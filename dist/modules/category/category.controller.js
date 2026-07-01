import { MongoServerError, ObjectId } from 'mongodb';
import { categoriesCollection } from './category.model.js';
import { logAudit } from '../audit/audit.controller.js';
const readParam = (value) => (Array.isArray(value) ? value[0] : value ?? '');
const toSlug = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
export const createCategory = async (req, res) => {
    const { name, slug, description, order, color, template } = req.body;
    const categorySlug = toSlug(slug ?? name);
    const existingCategory = await categoriesCollection().findOne({ slug: categorySlug });
    if (existingCategory) {
        res.status(409).json({ message: 'Category slug already exists' });
        return;
    }
    const now = new Date();
    try {
        const result = await categoriesCollection().insertOne({
            _id: new ObjectId(),
            name,
            slug: categorySlug,
            description,
            order: typeof order === 'number' ? order : 0,
            color: color ?? undefined,
            template: template ?? 'default',
            createdAt: now,
            updatedAt: now
        });
        res.status(201).json({ id: result.insertedId.toString(), name, slug: categorySlug, description, order: typeof order === 'number' ? order : 0, color: color ?? null, template: template ?? 'default' });
        const authReqCat = req;
        void logAudit('create', 'category', result.insertedId.toString(), authReqCat.user?.userId, `Created category: "${name}"`, { userName: authReqCat.user?.name, userEmail: authReqCat.user?.email, ipAddress: req.ip });
    }
    catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            res.status(409).json({ message: 'Category slug already exists' });
            return;
        }
        throw error;
    }
};
export const listCategories = async (_req, res) => {
    const categories = await categoriesCollection().find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.status(200).json(categories.map((category) => ({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        order: category.order ?? 0,
        color: category.color ?? null,
        template: category.template ?? 'default',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    })));
};
export const getCategoryById = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid category id' });
        return;
    }
    const category = await categoriesCollection().findOne({ _id: new ObjectId(id) });
    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    res.status(200).json({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        order: category.order ?? 0,
        color: category.color ?? null,
        template: category.template ?? 'default',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    });
};
export const getCategoryBySlug = async (req, res) => {
    const slug = readParam(req.params.slug).trim().toLowerCase();
    if (!slug) {
        res.status(400).json({ message: 'Invalid category slug' });
        return;
    }
    const category = await categoriesCollection().findOne({ slug });
    if (!category) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    res.status(200).json({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        description: category.description,
        order: category.order ?? 0,
        color: category.color ?? null,
        template: category.template ?? 'default',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    });
};
export const updateCategory = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid category id' });
        return;
    }
    const updates = {};
    if (req.body.name) {
        updates.name = req.body.name;
    }
    if (req.body.description !== undefined) {
        updates.description = req.body.description;
    }
    if (req.body.order !== undefined) {
        updates.order = req.body.order;
    }
    if (req.body.color !== undefined) {
        updates.color = req.body.color;
    }
    if (req.body.template !== undefined) {
        updates.template = req.body.template;
    }
    if (req.body.slug || req.body.name) {
        updates.slug = toSlug(req.body.slug ?? req.body.name);
    }
    updates.updatedAt = new Date();
    if (updates.slug) {
        const existingCategory = await categoriesCollection().findOne({
            slug: updates.slug,
            _id: { $ne: new ObjectId(id) }
        });
        if (existingCategory) {
            res.status(409).json({ message: 'Category slug already exists' });
            return;
        }
    }
    let result = null;
    try {
        result = await categoriesCollection().findOneAndUpdate({ _id: new ObjectId(id) }, { $set: updates }, { returnDocument: 'after' });
    }
    catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
            res.status(409).json({ message: 'Category slug already exists' });
            return;
        }
        throw error;
    }
    if (!result) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    res.status(200).json({
        id: result._id.toString(),
        name: result.name,
        slug: result.slug,
        description: result.description,
        order: result.order ?? 0,
        color: result.color ?? null,
        template: result.template ?? 'default',
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
    });
    const authReqCatUpd = req;
    void logAudit('update', 'category', result._id.toString(), authReqCatUpd.user?.userId, `Updated category: "${result.name}"`, { userName: authReqCatUpd.user?.name, userEmail: authReqCatUpd.user?.email, ipAddress: req.ip });
};
export const batchUpdateCategoryOrder = async (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: 'items must be a non-empty array' });
        return;
    }
    const ops = items
        .filter((item) => typeof item.id === 'string' && ObjectId.isValid(item.id) && typeof item.order === 'number')
        .map((item) => categoriesCollection().updateOne({ _id: new ObjectId(item.id) }, { $set: { order: item.order, updatedAt: new Date() } }));
    if (ops.length === 0) {
        res.status(400).json({ message: 'No valid items provided' });
        return;
    }
    await Promise.all(ops);
    res.status(200).json({ message: 'Order updated', count: ops.length });
};
export const deleteCategory = async (req, res) => {
    const id = readParam(req.params.id);
    if (!ObjectId.isValid(id)) {
        res.status(400).json({ message: 'Invalid category id' });
        return;
    }
    const result = await categoriesCollection().deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    const authReqDel = req;
    void logAudit('delete', 'category', id, authReqDel.user?.userId, `Deleted category`, { userName: authReqDel.user?.name, userEmail: authReqDel.user?.email, ipAddress: req.ip });
    res.status(200).json({ message: 'Category deleted' });
};
