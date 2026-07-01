import { Router } from 'express';
import { validateToken } from '../../middlewares/validateToken.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { addVideo, listVideos, deleteVideo } from './video.controller.js';
const router = Router();
router.get('/', listVideos);
router.post('/', validateToken, requireRole('admin', 'editor'), addVideo);
router.delete('/:id', validateToken, requireRole('admin', 'editor'), deleteVideo);
export { router as videoRoutes };
