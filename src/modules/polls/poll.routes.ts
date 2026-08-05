import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateParamsSchema } from '../../middlewares/validator.middleware.js';
import {
  createPoll,
  deletePoll,
  getPollById,
  listAdminPolls,
  listPublicPolls,
  updatePoll,
  votePoll
} from './poll.controller.js';
import { createPollSchema, pollIdSchema, updatePollSchema, votePollSchema } from './poll.schemas.js';

const router = Router();

// Rutas públicas
router.get('/public', listPublicPolls);
router.post('/:id/vote', validateParamsSchema(pollIdSchema), validateBodySchema(votePollSchema), votePoll);

// Rutas protegidas (administrador y editores)
router.get('/', validateToken, requireRole('admin', 'editor'), listAdminPolls);
router.get('/:id', validateToken, requireRole('admin', 'editor'), validateParamsSchema(pollIdSchema), getPollById);
router.post('/', validateToken, requireRole('admin', 'editor'), validateBodySchema(createPollSchema), createPoll);
router.patch('/:id', validateToken, requireRole('admin', 'editor'), validateParamsSchema(pollIdSchema), validateBodySchema(updatePollSchema), updatePoll);
router.delete('/:id', validateToken, requireRole('admin', 'editor'), validateParamsSchema(pollIdSchema), deletePoll);

export default router;
