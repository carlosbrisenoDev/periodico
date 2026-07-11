import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { getSettings, updateSettings, getPublicSettings } from './settings.controller.js';

const router = Router();

router.get('/', validateToken, requireRole('admin'), getSettings);
router.patch('/', validateToken, requireRole('admin'), updateSettings);
router.get('/public', getPublicSettings);

export { router as settingsRoutes };
