import { Router } from 'express';
import { validateBodySchema, validateParamsSchema, validateQuerySchema } from '../../middlewares/validator.middleware.js';
import { validateToken } from '../../middlewares/validateToken.js';
import { requireRole } from '../../middlewares/requireRole.js';
import { createReport, listReports, updateReportStatus } from './report.controller.js';
import { createReportSchema, listReportsQuerySchema, reportIdSchema, updateReportStatusSchema } from './report.schemas.js';
export const reportRoutes = Router();
// Public route to create a report
reportRoutes.post('/public/reports', validateBodySchema(createReportSchema), createReport);
// Admin routes
reportRoutes.get('/admin/reports', validateToken, requireRole('admin', 'editor'), validateQuerySchema(listReportsQuerySchema), listReports);
reportRoutes.patch('/admin/reports/:id/status', validateToken, requireRole('admin', 'editor'), validateParamsSchema(reportIdSchema), validateBodySchema(updateReportStatusSchema), updateReportStatus);
