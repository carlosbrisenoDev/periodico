import { Router } from 'express';
import { validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import {
  getArchive,
  getArticleBySlug,
  getArticleById,
  getArticlesByCategorySlug,
  getCategories,
  getFeatured,
  getHome,
  getLatest,
  getRecent,
  getSitemap,
  getTrending,
  getRecommendations,
  searchArticles,
  getVideos
} from './public.controller.js';
import { getPublicSettings } from '../settings/index.js';
import {
  publicArchiveSchema,
  publicArticleIdSchema,
  publicArticleSlugSchema,
  publicCategorySlugSchema,
  publicListSchema,
  publicRecommendationsSchema,
  publicSearchSchema
} from './public.schemas.js';

const router = Router();

router.get('/home', getHome);
router.get('/categories', getCategories);
router.get('/featured', getFeatured);
router.get('/latest', getLatest);
router.get('/recent', getRecent);
router.get('/trending', validateQuerySchema(publicListSchema), getTrending);
router.get('/recommendations', validateQuerySchema(publicRecommendationsSchema), getRecommendations);
router.get('/archive/:year/:month', validateParamsSchema(publicArchiveSchema), getArchive);
router.get('/sitemap', getSitemap);
router.get('/article/:slug', validateParamsSchema(publicArticleSlugSchema), getArticleBySlug);
router.get('/article/id/:id', validateParamsSchema(publicArticleIdSchema), getArticleById);
router.get('/category/:slug', validateParamsSchema(publicCategorySlugSchema), getArticlesByCategorySlug);
router.get('/search', validateQuerySchema(publicSearchSchema), searchArticles);
router.get('/videos', getVideos);
router.get('/settings', getPublicSettings);

export default router;
