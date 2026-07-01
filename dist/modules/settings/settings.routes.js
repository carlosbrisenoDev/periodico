import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { getSettings, updateSettings } from './settings.controller.js';
const router = Router();
router.get('/', requireRole('admin'), getSettings);
router.patch('/', requireRole('admin'), updateSettings);
export { router as settingsRoutes };
