import { Request, Response } from 'express';
import { MongoServerError, ObjectId } from 'mongodb';
import { categoriesCollection } from './category.model.js';

const readParam = (value: string | string[] | undefined): string => (Array.isArray(value) ? value[0] : value ?? '');

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, order } = req.body;
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
      createdAt: now,
      updatedAt: now
    });

    res.status(201).json({ id: result.insertedId.toString(), name, slug: categorySlug, description, order: typeof order === 'number' ? order : 0 });
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      res.status(409).json({ message: 'Category slug already exists' });
      return;
    }
    throw error;
  }
};

export const listCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await categoriesCollection().find({}).sort({ order: 1, createdAt: -1 }).toArray();
  res.status(200).json(
    categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      order: category.order ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))
  );
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
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
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  });
};

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
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
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const id = readParam(req.params.id);
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid category id' });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (req.body.name) {
    updates.name = req.body.name;
  }
  if (req.body.description !== undefined) {
    updates.description = req.body.description;
  }
  if (req.body.order !== undefined) {
    updates.order = req.body.order;
  }
  if (req.body.slug || req.body.name) {
    updates.slug = toSlug(req.body.slug ?? req.body.name);
  }
  updates.updatedAt = new Date();

  if (updates.slug) {
    const existingCategory = await categoriesCollection().findOne({
      slug: updates.slug as string,
      _id: { $ne: new ObjectId(id) }
    });
    if (existingCategory) {
      res.status(409).json({ message: 'Category slug already exists' });
      return;
    }
  }

  let result = null;
  try {
    result = await categoriesCollection().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
  } catch (error) {
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
    createdAt: result.createdAt,
    updatedAt: result.updatedAt
  });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
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

  res.status(200).json({ message: 'Category deleted' });
};
