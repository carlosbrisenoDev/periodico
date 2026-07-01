import { Router } from 'express';
import { requireRole } from '../../middlewares/requireRole.js';
import { validateToken, validateSubscriber } from '../../middlewares/validateToken.js';
import { validateBodySchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import { createCitizenReportSchema, listCitizenReportsQuerySchema, updateCitizenReportStatusSchema } from './citizen_report.schemas.js';
import { createCitizenReport, listCitizenReports, updateCitizenReportStatus, deleteCitizenReport } from './citizen_report.controller.js';
const router = Router();
// Public route to submit a report
router.post('/', validateSubscriber, validateBodySchema(createCitizenReportSchema), createCitizenReport);
// Admin routes
router.get('/', validateToken, requireRole('admin'), validateQuerySchema(listCitizenReportsQuerySchema), listCitizenReports);
router.patch('/:id/status', validateToken, requireRole('admin'), validateBodySchema(updateCitizenReportStatusSchema), updateCitizenReportStatus);
router.delete('/:id', validateToken, requireRole('admin'), deleteCitizenReport);
export const citizenReportRoutes = router;
