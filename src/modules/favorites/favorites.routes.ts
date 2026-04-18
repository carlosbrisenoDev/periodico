import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import {isFavoriteParams} from './favorites.schemas.js';
import {isFavorite} from './favorites.controller.js';

const router = Router();

router.get(
    "/isFavorite/:userId/:article:id",
    validateParamsSchema(isFavoriteParams),
    isFavorite
);

export default router;
