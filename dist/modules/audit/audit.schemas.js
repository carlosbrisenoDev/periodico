import { z } from 'zod';
export const listAuditLogsQuerySchema = z.object({
    action: z.enum(['create', 'update', 'delete', 'login', 'other']).optional(),
    entityType: z.string().optional(),
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
});
