import cors from 'cors';
import { env } from '../config.js';
const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter((origin) => origin.length > 0);
const allowAnyOrigin = allowedOrigins.includes('*');
export const corsMiddleware = cors({
    credentials: true,
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowAnyOrigin) {
            callback(null, true);
            return;
        }
        const requestOrigin = normalizeOrigin(origin);
        if (allowedOrigins.includes(requestOrigin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS origin not allowed: ${origin}`));
    }
});
