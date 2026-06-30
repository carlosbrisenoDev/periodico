import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import { createCommentSchema, listCommentsQuerySchema, updateCommentStatusSchema } from './comment.schemas.js';
import { createComment, listComments, updateCommentStatus, deleteComment } from './comment.controller.js';
const router = Router();
// Public route to submit a comment
router.post('/', validateBodySchema(createCommentSchema), createComment);
// Public route to list comments (usually filtered by articleId and status=approved)
router.get('/', validateQuerySchema(listCommentsQuerySchema), listComments);
// Admin routes for moderation
router.patch('/:id/status', validateToken, requireRole('admin'), validateBodySchema(updateCommentStatusSchema), updateCommentStatus);
router.delete('/:id', validateToken, requireRole('admin'), deleteComment);
export const commentRoutes = router;
