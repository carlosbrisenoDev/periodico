import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import {
  createSocialSchema,
  listSocialsQuerySchema,
  socialAuthorIdSchema,
  socialIdSchema,
  updateSocialSchema
} from './social.schemas.js';
import { createSocial, deleteSocial, getSocialById, listSocials, listSocialsByAuthor, updateSocial } from './social.controller.js';

export const socialRouter = Router();

socialRouter.get('/', validateQuerySchema(listSocialsQuerySchema), listSocials);
socialRouter.get('/author/:authorId', validateParamsSchema(socialAuthorIdSchema), validateQuerySchema(listSocialsQuerySchema), listSocialsByAuthor);
socialRouter.get('/:id', validateParamsSchema(socialIdSchema), getSocialById);
socialRouter.post('/', validateToken, requireRole('admin', 'editor'), validateBodySchema(createSocialSchema), createSocial);
socialRouter.patch('/:id', validateToken, requireRole('admin', 'editor'), validateParamsSchema(socialIdSchema), validateBodySchema(updateSocialSchema), updateSocial);
socialRouter.delete('/:id', validateToken, requireRole('admin', 'editor'), validateParamsSchema(socialIdSchema), deleteSocial);

export default socialRouter;

