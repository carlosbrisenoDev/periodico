import { Router } from 'express';
import { validateToken } from '../../middlewares/validateToken.js';
import { getSummary } from './dashboard.controller.js';

const router = Router();

router.get('/summary', validateToken, getSummary);

export default router;
