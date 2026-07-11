import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { getSettings, updateSettings, getPublicSettings } from './settings.controller.js';
const router = Router();
router.get('/', requireRole('admin'), getSettings);
router.patch('/', requireRole('admin'), updateSettings);
router.get('/public', getPublicSettings);
export { router as settingsRoutes };
