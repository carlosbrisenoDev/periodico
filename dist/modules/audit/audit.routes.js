import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { validateQuerySchema } from '../../middlewares/validator.middleware.js';
import { listAuditLogsQuerySchema } from './audit.schemas.js';
import { listAuditLogs } from './audit.controller.js';
const router = Router();
// Admin only routes
router.get('/', validateToken, requireRole('admin'), validateQuerySchema(listAuditLogsQuerySchema), listAuditLogs);
export const auditRoutes = router;
