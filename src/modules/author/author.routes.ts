import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import { authorIdSchema, createAuthorSchema, listAuthorArticlesQuerySchema, updateAuthorSchema } from './author.schemas.js';
import { createAuthor, deleteAuthor, getAuthorArticles, getAuthorById, listAuthors, updateAuthor } from './author.controller.js';

const router = Router();

router.get('/', listAuthors);
router.get('/:id/articles', validateParamsSchema(authorIdSchema), validateQuerySchema(listAuthorArticlesQuerySchema), getAuthorArticles);
router.get('/:id', validateParamsSchema(authorIdSchema), getAuthorById);
router.post('/', validateToken, requireRole('admin'), validateBodySchema(createAuthorSchema), createAuthor);
router.patch(
  '/:id',
  validateToken,
  requireRole('admin'),
  validateParamsSchema(authorIdSchema),
  validateBodySchema(updateAuthorSchema),
  updateAuthor
);
router.delete('/:id', validateToken, requireRole('admin'), validateParamsSchema(authorIdSchema), deleteAuthor);

export default router;
