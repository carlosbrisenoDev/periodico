import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema } from '../../middlewares/validator.middleware.js';
import {
  batchUpdateCategoryOrder,
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategories,
  updateCategory
} from './category.controller.js';

import { categoryIdSchema, categorySlugSchema, createCategorySchema, updateCategorySchema } from './category.schemas.js';

const router = Router();

router.get('/', listCategories);
router.get('/slug/:slug', validateParamsSchema(categorySlugSchema), getCategoryBySlug);
router.get('/:id', validateParamsSchema(categoryIdSchema), getCategoryById);
router.post('/', validateToken, requireRole('admin'), validateBodySchema(createCategorySchema), createCategory);
router.patch(
  '/batch-order',
  validateToken,
  requireRole('admin'),
  batchUpdateCategoryOrder
);
router.patch(
  '/:id',
  validateToken,
  requireRole('admin'),
  validateParamsSchema(categoryIdSchema),
  validateBodySchema(updateCategorySchema),
  updateCategory
);
router.delete('/:id', validateToken, requireRole('admin'), validateParamsSchema(categoryIdSchema), deleteCategory);


export default router;
