import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import {
  articleIdSchema,
  articleSlugSchema,
  createArticleSchema,
  listArticlesQuerySchema,
  updateArticleFeatureSchema,
  updateArticleSchema,
  updateArticleStatusSchema
} from './article.schemas.js';
import {
  createArticle,
  duplicateArticle,
  deleteArticle,
  getArticleById,
  getArticleBySlug,
  listArticles,
  publishArticleNow,
  updateArticle,
  updateArticleFeature,
  updateArticleStatus
} from './article.controller.js';

const router = Router();

router.get('/', validateQuerySchema(listArticlesQuerySchema), listArticles);
router.get('/slug/:slug', validateParamsSchema(articleSlugSchema), getArticleBySlug);
router.get('/:id', validateParamsSchema(articleIdSchema), getArticleById);
router.post('/', validateToken, requireRole('admin', 'editor'), validateBodySchema(createArticleSchema), createArticle);
router.patch(
  '/:id/feature',
  validateToken,
  requireRole('admin'),
  validateParamsSchema(articleIdSchema),
  validateBodySchema(updateArticleFeatureSchema),
  updateArticleFeature
);
router.post('/:id/publish-now', validateToken, requireRole('admin'), validateParamsSchema(articleIdSchema), publishArticleNow);
router.post('/:id/duplicate', validateToken, requireRole('admin', 'editor'), validateParamsSchema(articleIdSchema), duplicateArticle);
router.patch(
  '/:id/status',
  validateToken,
  requireRole('admin'),
  validateParamsSchema(articleIdSchema),
  validateBodySchema(updateArticleStatusSchema),
  updateArticleStatus
);
router.patch(
  '/:id',
  validateToken,
  requireRole('admin', 'editor'),
  validateParamsSchema(articleIdSchema),
  validateBodySchema(updateArticleSchema),
  updateArticle
);
router.delete('/:id', validateToken, requireRole('admin'), validateParamsSchema(articleIdSchema), deleteArticle);

export default router;
