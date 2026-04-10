import { Router } from 'express';
import { validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import {
  getArchive,
  getArticleBySlug,
  getArticlesByCategorySlug,
  getCategories,
  getFeatured,
  getHome,
  getLatest,
  getSitemap,
  getTrending,
  searchArticles
} from './public.controller.js';
import {
  publicArchiveSchema,
  publicArticleSlugSchema,
  publicCategorySlugSchema,
  publicListSchema,
  publicSearchSchema
} from './public.schemas.js';

const router = Router();

router.get('/home', getHome);
router.get('/categories', getCategories);
router.get('/featured', getFeatured);
router.get('/latest', getLatest);
router.get('/trending', validateQuerySchema(publicListSchema), getTrending);
router.get('/archive/:year/:month', validateParamsSchema(publicArchiveSchema), getArchive);
router.get('/sitemap', getSitemap);
router.get('/article/:slug', validateParamsSchema(publicArticleSlugSchema), getArticleBySlug);
router.get('/category/:slug', validateParamsSchema(publicCategorySlugSchema), getArticlesByCategorySlug);
router.get('/search', validateQuerySchema(publicSearchSchema), searchArticles);

export default router;
